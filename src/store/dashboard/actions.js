import { createActionThunk } from "../../utils/redux";
import * as network from "./network";

export const workFlowAction = createActionThunk(
  "WORKFLOWDATA",
  network.workFlow
);