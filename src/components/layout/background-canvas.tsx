// Static background — anchored to the app's darkest theme tones:
// header #090F1A, dock/base #0B1320, layout ground #0A1628. Just a faint
// navy lift near the top that falls off into the header colour, plus the
// signature gold whisper. No bright blue — stays inside the theme.
export function BackgroundCanvas() {
  return (
    <div
      aria-hidden
      className="fixed inset-0 -z-0 pointer-events-none"
      style={{
        background:
          "radial-gradient(115% 80% at 50% 0%, #0F2138 0%, #0B1728 42%, #090F1A 100%), " +
          "radial-gradient(70% 55% at 88% 100%, rgba(212,175,122,0.045) 0%, rgba(212,175,122,0) 60%), " +
          "#0A1628",
      }}
    >
      {/* Vignette — keeps the page edges as dark as the header */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(100% 100% at 50% 35%, rgba(0,0,0,0) 50%, rgba(4,7,13,0.5) 100%)",
        }}
      />
    </div>
  );
}
