import { validateCommaSeparatedList } from "../../menu/new";

export function checkNameValidity(visInfo, newParamName) {
  const blacklistedCharacters = ["-", "#", "/", "(", ")", "="];
  const currentProperties = visInfo.parameters.map(({ name }) => name);

  if (currentProperties.includes(newParamName)) {
    return false;
  } else if (newParamName == "") {
    return false;
  } else if (
    blacklistedCharacters.some((char) => newParamName.includes(char))
  ) {
    return false;
  } else if (newParamName.length > 20) {
    return false;
  } else {
    return true;
  }
}

export { validateCommaSeparatedList };
