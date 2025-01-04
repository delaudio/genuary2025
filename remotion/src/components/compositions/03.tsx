import { Composition } from "remotion";
import { P5Sketch030124 } from "../sketches/030124";
import { myCompSchema2 } from "../../HelloWorld/Logo";

export default function Composition030124() {
  return (
    <Composition
      id="03-January"
      component={P5Sketch030124}
      durationInFrames={505}
      fps={60}
      width={1080}
      height={1080}
      schema={myCompSchema2}
      defaultProps={{
        logoColor1: "#91EAE4",
        logoColor2: "#86A8E7",
      }}
    />
  );
}
