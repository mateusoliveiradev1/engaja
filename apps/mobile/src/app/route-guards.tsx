import type { Href } from "expo-router";
import type { PropsWithChildren, ReactNode } from "react";

import { Redirect, useRouter } from "expo-router";
import React from "react";

import {
  canAccessRouteGroup,
  getHomeHrefForSession,
  mobileRouteGroups,
  type MobileRouteGroupKey,
} from "../navigation/routes.js";
import { ProductAccessStateScreen } from "./product-shell.js";
import { useSession } from "./providers.js";

interface ProtectedRouteProps extends PropsWithChildren {
  readonly group: Exclude<MobileRouteGroupKey, "auth">;
}

export function ProtectedRoute({ children, group }: ProtectedRouteProps): ReactNode {
  const router = useRouter();
  const { logout, session, sessionStatus } = useSession();
  const [isLoggingOut, setLoggingOut] = React.useState(false);

  if (sessionStatus === "restoring") {
    return (
      <ProductAccessStateScreen
        description="Estamos confirmando sua sessao salva antes de abrir dados da loja."
        isLoading
        title="Abrindo sua area"
      />
    );
  }

  if (isLoggingOut) {
    return (
      <ProductAccessStateScreen
        description="Estamos encerrando este acesso antes de voltar para a entrada segura."
        isLoading
        title="Saindo do Engaja"
      />
    );
  }

  const access = canAccessRouteGroup(session, group);

  if (!access.allowed) {
    if (session === null) {
      return <Redirect href={access.redirectTo as Href} />;
    }

    const homeHref = getHomeHrefForSession(session);
    const targetGroup = mobileRouteGroups[group];
    const canReturnToHome = homeHref !== targetGroup.entryHref;

    return (
      <ProductAccessStateScreen
        actionLabel={canReturnToHome ? "Voltar para minha area" : "Sair do Engaja"}
        description="Esta tela fica reservada para outra funcao da equipe. Mantivemos os dados do setor protegidos e voce pode voltar para sua area principal."
        onActionPress={() => {
          if (canReturnToHome) {
            router.replace(homeHref as Href);
            return;
          }

          setLoggingOut(true);
          void logout().catch(() => setLoggingOut(false));
        }}
        title="Area nao liberada"
      />
    );
  }

  if (session === null) {
    return <Redirect href={access.redirectTo as Href} />;
  }

  return <>{children}</>;
}
