import React from "react";
import {
  registerRoot,
  Composition,
  AbsoluteFill,
  Img,
  staticFile,
  useCurrentFrame,
  interpolate,
  Easing,
} from "remotion";
import scenes from "../passport-narration.json";
const C = {
  paper: "#f5f7f6",
  ink: "#172b27",
  pine: "#165d4c",
  muted: "#52645e",
  white: "#ffffff",
  line: "#dce4df",
  blue: "#627c95",
  gold: "#a6813c",
};
function Brand() {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 18,
        fontWeight: 800,
        fontSize: 36,
      }}
    >
      <Img
        src={staticFile("brand/mark-light.svg")}
        style={{ width: 52, height: 52 }}
      />
      IncomeFlow
    </div>
  );
}
function Scene({
  sceneId = "problem",
  plate = false,
}: {
  sceneId?: string;
  plate?: boolean;
}) {
  const f = useCurrentFrame(),
    scene = scenes.find((s) => s.id === sceneId)!;
  const rise = interpolate(f, [0, 24], [30, 0], {
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });
  return (
    <AbsoluteFill
      style={{
        background: C.paper,
        color: C.ink,
        fontFamily: "Manrope, sans-serif",
        padding: 72,
      }}
    >
      <style>{`@font-face{font-family:Manrope;src:url('${staticFile("fonts/manrope-400.ttf")}')}@font-face{font-family:Manrope;src:url('${staticFile("fonts/manrope-800.ttf")}');font-weight:800}`}</style>
      <Brand />
      {plate ? (
        <>
          <h1
            style={{
              fontSize: 48,
              margin: "24px 0 0",
              letterSpacing: "-0.03em",
            }}
          >
            {scene.title}
          </h1>
          <div
            style={{
              position: "absolute",
              left: 72,
              top: 220,
              width: 1776,
              height: 790,
              background: C.white,
              borderRadius: 14,
            }}
          />
          <div
            style={{
              position: "absolute",
              bottom: 24,
              fontSize: 20,
              color: C.muted,
            }}
          >
            Genuine application footage. Edited pacing is not a network-latency
            measurement. Valueless testnet funds.
          </div>
        </>
      ) : (
        <div style={{ transform: `translateY(${rise}px)`, paddingTop: 95 }}>
          {sceneId === "problem" && (
            <>
              <h1
                style={{
                  fontSize: 100,
                  lineHeight: 1.1,
                  letterSpacing: "-0.04em",
                  maxWidth: 1400,
                  margin: 0,
                }}
              >
                The work is finished.
                <br />
                The financial admin isn’t.
              </h1>
              <p style={{ fontSize: 32, color: C.muted, marginTop: 36 }}>
                An illustrative freelancer scenario
              </p>
              <div style={{ display: "flex", gap: 52, marginTop: 70 }}>
                {[
                  "Request payment",
                  "Track what arrives",
                  "Organize income",
                ].map((s, i) => (
                  <div
                    key={s}
                    style={{
                      fontSize: 30,
                      borderTop: `3px solid ${C.pine}`,
                      paddingTop: 24,
                      opacity: interpolate(
                        f,
                        [35 + i * 30, 65 + i * 30],
                        [0, 1],
                        { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
                      ),
                    }}
                  >
                    {s}
                  </div>
                ))}
              </div>
            </>
          )}
          {sceneId === "research" && (
            <>
              <h1 style={{ fontSize: 64, margin: 0 }}>
                The wider payment problem
              </h1>
              <div
                style={{
                  display: "flex",
                  gap: 64,
                  alignItems: "center",
                  marginTop: 54,
                }}
              >
                <strong style={{ fontSize: 200, color: C.pine }}>59%</strong>
                <p style={{ fontSize: 40, lineHeight: 1.4, maxWidth: 950 }}>
                  of surveyed small businesses had invoices overdue by at least
                  30 days.
                </p>
              </div>
              <p style={{ fontSize: 29, marginTop: 36 }}>
                QuickBooks, 2026 Small Business Late Payments Report
              </p>
              <p style={{ fontSize: 24, color: C.muted, maxWidth: 1500 }}>
                Small businesses broadly, not crypto freelancers. This does not
                establish IncomeFlow’s effectiveness or guarantee earlier
                payment.
              </p>
              <p style={{ fontSize: 21, color: C.muted, marginTop: 36 }}>
                quickbooks.intuit.com/r/small-business-data/small-business-late-payments-report-2026/
              </p>
            </>
          )}
          {sceneId === "closing" && (
            <>
              <h1
                style={{
                  fontSize: 108,
                  lineHeight: 1.08,
                  letterSpacing: "-0.04em",
                  margin: 0,
                }}
              >
                Give every payment
                <br />a purpose.
              </h1>
              <p style={{ fontSize: 40, color: C.pine, marginTop: 46 }}>
                From payment requested to income organized.
              </p>
              <p style={{ fontSize: 29, marginTop: 56 }}>
                incomeflow-gamma.vercel.app
              </p>
              <p style={{ fontSize: 27 }}>github.com/sopskistar/IncomeFlow</p>
              <p style={{ fontSize: 23, color: C.muted, marginTop: 42 }}>
                Testnet prototype. Owner-controlled allocations. Public,
                verifiable proof.
              </p>
            </>
          )}
        </div>
      )}
    </AbsoluteFill>
  );
}
registerRoot(() => (
  <>
    <Composition
      id="PassportMotion"
      component={Scene}
      width={1920}
      height={1080}
      fps={30}
      durationInFrames={600}
      defaultProps={{ sceneId: "problem", plate: false }}
    />
    <Composition
      id="PassportPlate"
      component={Scene}
      width={1920}
      height={1080}
      fps={30}
      durationInFrames={1}
      defaultProps={{ sceneId: "solution", plate: true }}
    />
  </>
));
