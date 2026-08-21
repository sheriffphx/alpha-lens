"use client";

import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useRouter } from "next/navigation";

type LaunchAppButtonProps = {
  children: React.ReactNode;
  className: string;
};

export function LaunchAppButton({ children, className }: LaunchAppButtonProps) {
  const router = useRouter();

  return (
    <ConnectButton.Custom>
      {({ account, openConnectModal, mounted }) => {
        const handleClick = () => {
          if (account) {
            router.push("/dashboard");
          } else {
            openConnectModal();
          }
        };

        return (
          <button
            type="button"
            className={className}
            disabled={!mounted}
            onClick={handleClick}
          >
            {children}
          </button>
        );
      }}
    </ConnectButton.Custom>
  );
}
