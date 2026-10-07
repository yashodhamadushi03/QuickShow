const BlurCircle = ({ top = "auto", left = "auto", right = "auto", bottom = "auto" }) => {
  return (
    <div
      className="absolute z-0 h-72 w-72 rounded-full bg-red-500/30 blur-3xl"
      style={{ top, left, right, bottom }}
    />
  );
};

export default BlurCircle;