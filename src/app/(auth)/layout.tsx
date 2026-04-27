export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen cork-texture flex items-center justify-center p-4">
      <div
        className="w-full max-w-md paper-column p-10"
        style={{ position: "relative" }}
      >
        <div
          style={{
            position: "absolute",
            top: -10,
            left: "50%",
            transform: "translateX(-50%)",
            width: 32,
            height: 20,
            background: "rgba(44,24,16,0.25)",
            borderRadius: "0 0 4px 4px",
          }}
        />
        {children}
      </div>
    </div>
  )
}
