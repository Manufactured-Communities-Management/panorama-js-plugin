import React from 'react';
import {LeRed} from '@lowentry/react-redux';
import {LeUtils} from '@lowentry/utils';


const animationId = 'mcmhomes_panorama_viewer_default_loading_widget_' + LeUtils.uniqueId();
const css = `
	@keyframes ${animationId}_fadein {
		0% {opacity: 0;}
		67% {opacity: 0;}
		100% {opacity: 1;}
	}
	@keyframes ${animationId}_spin {
		0% {transform:rotate(0deg);}
		100% {transform: rotate(360deg);}
	}
`;


export const PanoramaDefaultLoadingWidget = LeRed.memo((props) =>
{
	return (<>
		<style>{css}</style>
		<div style={{width:'100%', height:'100%', display:'flex', justifyContent:'center', alignItems:'center', animation:animationId + '_fadein 3s ease-in'}}>
			<svg xmlns="http://www.w3.org/2000/svg" viewBox="-50 -50 100 100" preserveAspectRatio="xMidYMid" style={{maxWidth:'160px', maxHeight:'160px', shapeRendering:'auto', display:'block', background:'transparent'}}>
				<circle strokeDasharray="164.93361431346415 56.97787143782138" r="35" strokeWidth="5" stroke="#0099e5" fill="none" cy="0" cx="0" style={{animation:animationId + '_spin 1.5s linear infinite'}}/>
			</svg>
		</div>
	</>);
});
