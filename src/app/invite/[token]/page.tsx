import { prisma } from "@/lib/db";
import { auth } from "@/auth";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Coin } from "@/components/Coin";
import { AcceptInviteButton } from "@/components/AcceptInviteButton";

export default async function InvitePreviewPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const session = await auth();

  const inv = await prisma.invitation.findUnique({
    where: { token },
    include: {
      group: { include: { members: true } },
      createdBy: { select: { name: true, image: true } },
    },
  });

  if (!inv) {
    return (
      <div className="flex-1 grid place-items-center px-6 py-16">
        <div className="card p-8 max-w-sm text-center flex flex-col gap-4 items-center">
          <div className="text-5xl">🚫</div>
          <h1 className="text-xl font-bold">Invitation introuvable</h1>
          <p className="text-sm text-[var(--muted)]">
            Le lien est peut-être incorrect ou révoqué.
          </p>
          <Link href="/" className="btn-primary">Aller à l&apos;accueil</Link>
        </div>
      </div>
    );
  }

  const expired = !!(inv.expiresAt && inv.expiresAt.getTime() < Date.now());
  const exhausted = inv.maxUses != null && inv.uses >= inv.maxUses;

  if (!session?.user) {
    const callback = encodeURIComponent(`/invite/${token}`);
    redirect(`/login?callbackUrl=${callback}`);
  }

  const alreadyMember = await prisma.groupMember.findUnique({
    where: { userId_groupId: { userId: session.user.id, groupId: inv.groupId } },
  });
  if (alreadyMember) {
    redirect(`/groups/${inv.groupId}`);
  }

  return (
    <div className="flex-1 grid place-items-center px-6 py-16">
      <div className="card p-8 max-w-md w-full flex flex-col gap-6 items-center text-center">
        <Coin size={56} />
        <div>
          <div className="card-section-title">Invitation</div>
          <h1 className="text-2xl font-black tracking-tight mt-1">{inv.group.name}</h1>
          <p className="text-sm text-[var(--muted)] mt-2">
            {inv.createdBy.name ?? "Un ami"} t&apos;invite à rejoindre ce groupe.
          </p>
          <p className="text-xs text-[var(--muted)] mt-1">
            {inv.group.members.length} membre{inv.group.members.length > 1 ? "s" : ""}
          </p>
        </div>

        {expired || exhausted ? (
          <div className="text-sm text-[var(--danger)] font-medium">
            {expired ? "Cette invitation a expiré." : "Cette invitation a atteint son nombre max d'utilisations."}
          </div>
        ) : (
          <AcceptInviteButton token={token} />
        )}

        <Link href="/" className="text-xs text-[var(--muted)] hover:underline">
          Plus tard
        </Link>
      </div>
    </div>
  );
}
