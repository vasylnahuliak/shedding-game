import { useState } from 'react';
import { TextInput } from 'react-native';

import { MAX_PLAYER_NAME_LENGTH, parseWithSchema, RoomNameSchema } from '@shedding-game/shared';

import { useUpdateRoomOptionsMutation } from '@/api';
import { ModalShell } from '@/components/Modal';
import { useAppTranslation } from '@/i18n';

type RenameRoomModalContentProps = {
  roomId: string;
  currentName: string;
  onClose: () => void;
};

export const RenameRoomModalContent = ({
  roomId,
  currentName,
  onClose,
}: RenameRoomModalContentProps) => {
  const { t } = useAppTranslation(['lobby', 'common']);
  const [name, setName] = useState(currentName);
  const updateRoomOptionsMutation = useUpdateRoomOptionsMutation();
  const normalizedName = parseWithSchema(RoomNameSchema, name);

  const handleSave = async () => {
    if (normalizedName) {
      try {
        await updateRoomOptionsMutation.mutateAsync({ roomId, name: normalizedName });
        onClose();
      } catch {
        // onError in useUpdateRoomOptionsMutation handles logging; modal stays open on failure
      }
    } else {
      onClose();
    }
  };

  return (
    <ModalShell
      title={t('lobby:screen.renameTitle')}
      onClose={onClose}
      buttons={[
        { variant: 'secondary', title: t('common:buttons.cancel'), onPress: onClose },
        {
          variant: 'success',
          title: t('common:buttons.save'),
          disabled: updateRoomOptionsMutation.isPending,
          onPress: () => void handleSave(),
        },
      ]}
    >
      <TextInput
        className="mb-4 rounded-[10px] border border-border-input px-3.5 py-2.5 text-[16px] text-text-primary"
        placeholderTextColorClassName="accent-text-placeholder"
        value={name}
        onChangeText={setName}
        placeholder={t('lobby:screen.renamePlaceholder')}
        maxLength={MAX_PLAYER_NAME_LENGTH}
        autoFocus
        autoCorrect={false}
        autoCapitalize="none"
        returnKeyType="done"
        onSubmitEditing={() => void handleSave()}
      />
    </ModalShell>
  );
};
