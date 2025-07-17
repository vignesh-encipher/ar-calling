import { createStore, applyMiddleware, combineReducers, compose } from "redux";
import thunkMiddleware from "redux-thunk";
import promiseMiddleware from "redux-promise";
import { createWrapper } from "next-redux-wrapper";
import { reducer as DashboardReducer } from "./dashboard";

const reducers = combineReducers({
  dashboard: DashboardReducer,
});

const middlewares = [thunkMiddleware, promiseMiddleware];

if (process.env.NEXT_PUBLIC_NODE_ENV !== "production") {
  const { logger } = require("redux-logger");
  middlewares.push(logger);
}

export const store = createStore(
  reducers,
  compose(applyMiddleware(...middlewares))
);

const makeStore = () => store;

export const wrapper = createWrapper(makeStore);
