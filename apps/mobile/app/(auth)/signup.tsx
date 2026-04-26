import { useLocalSearchParams } from "expo-router";

import { InviteSignupScreen } from "../../src/app/screens.js";

export default function SignupRoute() {
  const params = useLocalSearchParams<{
    convite?: string;
    token?: string;
  }>();

  return <InviteSignupScreen initialInviteToken={params.convite ?? params.token} />;
}
