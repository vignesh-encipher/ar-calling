export async function workFlow() {
  const options = {
    method: "GET",
  };
  
  try {
    const response = await fetch('/api/comments', options);
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching workflow data:', error);
    return null;
  }
}
