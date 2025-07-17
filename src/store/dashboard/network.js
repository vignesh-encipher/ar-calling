import { requestPortal } from "../../utils/network";

export async function workFlow() {
  const options = {
    method: "GET",
  };
  const data = await requestPortal(
    `/comments`,
    options
  );
  return data;
}
