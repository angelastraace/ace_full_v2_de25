type Avatar = {
  name: string;
  animated: boolean;
  metadata: any;
};

export function AceKatAvatar({ avatar }: { avatar: Avatar }) {
  if (!avatar) return null;

  const animationClass =
    avatar.metadata.animation === "pulse"
      ? "ace-pulse"
      : avatar.metadata.animation === "cosmic"
      ? "ace-cosmic"
      : "";

  return (
    <div
      className={`w-20 h-20 rounded-full overflow-hidden ${animationClass}`}
    >
      <img
        src={avatar.metadata.image}
        alt={avatar.name}
        className="w-full h-full object-cover"
      />
    </div>
  );
}
