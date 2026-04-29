import Svg, { Path } from 'react-native-svg';

import { LightAuthButton } from '../LightAuthButton/LightAuthButton';

type GoogleAuthButtonProps = {
  isBusy: boolean;
  label: string;
  onPress: () => void;
};

const GoogleMark = () => (
  <Svg width={20} height={20} viewBox="0 0 18 18" accessible={false}>
    <Path
      fill="#4285F4"
      d="M17.64 9.2045c0-.638-.0573-1.2527-.1636-1.8436H9v3.4818h4.8436c-.2086 1.125-.842 2.0782-1.7954 2.7164v2.2582h2.9086c1.7018-1.5664 2.6832-3.874 2.6832-6.6128z"
    />
    <Path
      fill="#34A853"
      d="M9 18c2.43 0 4.4673-.8068 5.9564-2.1836l-2.9086-2.2582c-.8068.54-1.8368.8591-3.0478.8591-2.344 0-4.3282-1.5832-5.0364-3.7091H.9573v2.3318C2.4382 15.9827 5.4818 18 9 18z"
    />
    <Path
      fill="#FBBC05"
      d="M3.9636 10.7089c-.18-.54-.2836-1.1168-.2836-1.7089s.1036-1.1689.2836-1.7089V4.9591H.9573C.3477 6.1732 0 7.5441 0 9s.3477 2.8268.9573 4.0409l3.0063-2.332z"
    />
    <Path
      fill="#EA4335"
      d="M9 3.5795c1.3214 0 2.5077.4541 3.4405 1.3459l2.5814-2.5814C13.4636.8918 11.4264 0 9 0 5.4818 0 2.4382 2.0173.9573 4.9591l3.0063 2.3318C4.6718 5.1627 6.656 3.5795 9 3.5795z"
    />
  </Svg>
);

export const GoogleAuthButton = ({ isBusy, label, onPress }: GoogleAuthButtonProps) => (
  <LightAuthButton isBusy={isBusy} label={label} onPress={onPress} iconSlotClassName="pl-0.5">
    <GoogleMark />
  </LightAuthButton>
);
