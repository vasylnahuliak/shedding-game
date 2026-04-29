const form = document.getElementById('account-deletion-form');
const submitButton = document.getElementById('submit-button');
const statusElement = document.getElementById('form-status');

const getSubmissionCandidates = () => {
  const sameOriginApiPath = '/api/account-deletion-requests';
  const candidates = [sameOriginApiPath];

  const { hostname, protocol, port } = window.location;
  const isLocalHostname =
    hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '0.0.0.0';

  if (isLocalHostname && port !== '3000') {
    candidates.push(`${protocol}//${hostname}:3000/account-deletion-requests`);
  }

  return candidates;
};

const submitRequest = async (url, body) => {
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept-Language': navigator.language || 'en',
    },
    body: JSON.stringify(body),
  });

  const payload = await response.json().catch(() => null);
  const isAcceptedPayload =
    payload &&
    typeof payload === 'object' &&
    payload.status === 'accepted' &&
    typeof payload.requestId === 'string';

  return {
    response,
    payload,
    isAcceptedPayload,
  };
};

const setStatus = (message, tone) => {
  if (!statusElement) {
    return;
  }

  statusElement.textContent = message;
  if (tone) {
    statusElement.setAttribute('data-tone', tone);
  } else {
    statusElement.removeAttribute('data-tone');
  }
};

const setPending = (pending) => {
  if (!(submitButton instanceof HTMLButtonElement)) {
    return;
  }

  submitButton.disabled = pending;
  submitButton.textContent = pending ? 'Submitting...' : 'Submit request';
};

if (form instanceof HTMLFormElement) {
  form.addEventListener('submit', async (event) => {
    event.preventDefault();

    const formData = new FormData(form);
    const email = String(formData.get('email') || '').trim();
    const displayName = String(formData.get('displayName') || '').trim();
    const userId = String(formData.get('userId') || '').trim();
    const notes = String(formData.get('notes') || '').trim();

    if (!email) {
      setStatus('Enter the email address used by the account you want deleted.', 'error');
      return;
    }

    setPending(true);
    setStatus('', undefined);

    try {
      const requestBody = {
        email,
        displayName: displayName || undefined,
        userId: userId || undefined,
        notes: notes || undefined,
      };
      const candidates = getSubmissionCandidates();

      let lastFailureMessage = 'We could not submit the deletion request. Please try again.';

      for (const candidate of candidates) {
        try {
          const { response, payload, isAcceptedPayload } = await submitRequest(
            candidate,
            requestBody
          );

          if (!response.ok) {
            lastFailureMessage =
              payload && typeof payload.message === 'string' ? payload.message : lastFailureMessage;
            continue;
          }

          if (!isAcceptedPayload) {
            lastFailureMessage =
              'The page reached a server, but it was not the account deletion API.';
            continue;
          }

          form.reset();

          setStatus(
            `Your deletion request has been received. Request ID: ${payload.requestId}.`,
            'success'
          );
          return;
        } catch {
          lastFailureMessage = 'Network error. Please try again in a moment.';
        }
      }

      setStatus(lastFailureMessage, 'error');
    } catch {
      setStatus('Network error. Please try again in a moment.', 'error');
    } finally {
      setPending(false);
    }
  });
}
