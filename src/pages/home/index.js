import React, { useEffect } from 'react'
import { actions as dashbaordActions } from "../../store/dashboard";
import {connect} from "react-redux";

const Home = ({workFlowData, WorlFlow}) => {
    console.log(WorlFlow);

    useEffect(() => {
        workFlowData()
    }, [])
  return (
    <div>Home</div>
  )
}
const enhancer = connect(
    (state) => ({
      WorlFlow: state
    }),
    {
      workFlowData:dashbaordActions.workFlowAction
    }
  );
export default enhancer(Home)