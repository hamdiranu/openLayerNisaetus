import createStore from "unistore";
// import axios from "axios";

const initialState = {
    currentLat: -2.5040852618529215,
    currentLong: 117.50976562500001,
    currentZoom: 5,
};

export const store = createStore(initialState);

export const actions = store => ({

});