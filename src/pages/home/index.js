import React, { useEffect } from 'react'
import { actions as dashbaordActions } from "../../store/dashboard";
import {connect} from "react-redux";
import PatientList from './patientList';

const Home = ({workFlowData, WorlFlow}) => {
    console.log(WorlFlow);

    useEffect(() => {
        workFlowData()
    }, [])
  return (
    <div>
      <PatientList />
    </div>
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