import clsx from "clsx";
import { useSearchParams } from "react-router-dom";
import { AIExpandButton } from "../new-ai/components/ui";

const SCREENS = [
  { screen: "data", icon: "graphic_eq", text: "Data sources" },
  { screen: "dashboard", icon: "tune", text: "Data mappings", className: "primary" },
  { screen: "code", icon: "code", text: "Code" },
  { screen: "docs", icon: "docs", text: "Docs" },
];

// The left pane's tabs, down the side of the editor. Each shows its name when
// hovered, like the AI's buttons.
export function SideNav({ currentScreen, setCurrentScreen, isDocsVisible }) {
  const [searchParams] = useSearchParams();
  if (searchParams.get("dashboard") === "false") return null;

  return (
    <nav className="side-nav">
      {SCREENS.filter(({ screen }) => screen !== "docs" || isDocsVisible).map(
        ({ screen, icon, text, className }) => (
          <AIExpandButton
            key={screen}
            icon={icon}
            text={text}
            className={clsx(className, currentScreen.left === screen && "active")}
            onClick={() => setCurrentScreen({ ...currentScreen, left: screen })}
          />
        ),
      )}
    </nav>
  );
}
