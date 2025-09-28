interface TopBannerProps {
  message?: string;
}

export const TopBanner = ({ message = "Limited time: Double points on all purchases this week." }: TopBannerProps) => {
  return (
    <div className="w-full bg-secondary text-secondary-foreground">
      <div className="mx-auto px-6 py-2 text-center text-sm">
        {message}
      </div>
    </div>
  );
};
