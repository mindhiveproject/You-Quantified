export async function fetchCode(codeUrl) {
  try {
    const response = await fetch(codeUrl);

    if (!response.ok) {
      throw new Error(
        `Failed to fetch code snippet. Status: ${response.status}`
      );
    }

    const codeString = await response.text();

    return codeString;
  } catch (error) {
    console.error("Error fetching code snippet:", error.message);
    throw error;
  }
}
