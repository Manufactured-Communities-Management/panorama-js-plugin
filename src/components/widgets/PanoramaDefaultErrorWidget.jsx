import React from 'react';
import {LeRed} from '@lowentry/react-redux';
import {LeUtils} from '@lowentry/utils';


const cssId = 'mcmhomes_panorama_viewer_default_error_widget_' + LeUtils.uniqueId();
const css = `
	@keyframes ${cssId}_fadein {
		0% {opacity: 0;}
		100% {opacity: 1;}
	}
	
	.${cssId}_button_tryagain {
		transition: background-color 250ms cubic-bezier(0.4, 0, 0.2, 1) 0ms, box-shadow 250ms cubic-bezier(0.4, 0, 0.2, 1) 0ms;
		background: #3690CC;
		box-shadow: 0px 3px 1px -2px rgba(0,0,0,0.2),0px 2px 2px 0px rgba(0,0,0,0.14),0px 1px 5px 0px rgba(0,0,0,0.12);
	}
	.${cssId}_button_tryagain:hover {
		background: #23658E;
		box-shadow: 0px 2px 4px -1px rgba(0,0,0,0.2),0px 4px 5px 0px rgba(0,0,0,0.14),0px 1px 10px 0px rgba(0,0,0,0.12);
	}
	.${cssId}_button_tryagain:active {
		transition: background-color 350ms cubic-bezier(0.4, 0, 0.2, 1) 0ms, box-shadow 350ms cubic-bezier(0.4, 0, 0.2, 1) 0ms;
		background: #6593AF;
		box-shadow: 0px 5px 5px -3px rgba(0,0,0,0.2),0px 8px 10px 1px rgba(0,0,0,0.14),0px 3px 14px 2px rgba(0,0,0,0.12);
	}
`;


export const PanoramaDefaultErrorWidget = LeRed.memo(({retry, message, reason, id, data}) =>
{
	return (<>
		<style>{css}</style>
		<div style={{width:'100%', height:'100%', overflow:'hidden', display:'flex', justifyContent:'center', alignItems:'center', animation:cssId + '_fadein 0.4s ease-in'}}>
			<div style={{maxWidth:'100%', maxHeight:'100%', overflow:'auto', backgroundColor:'#383838', padding:'20px 24px', borderRadius:'4px', fontFamily:'"Roboto", "Helvetica", "Arial", sans-serif', fontSize:'0.875rem', boxShadow:'0 11px 15px -7px rgba(0, 0, 0, 0.2), 0px 24px 38px 3px rgba(0, 0, 0, 0.14), 0px 9px 46px 8px rgba(0, 0, 0, 0.12)'}}>
				<div style={{display:'flex', flexDirection:'column', alignItems:'center'}}>
					<div style={{display:'flex', flexDirection:'row', backgroundColor:'#150B0B', color:'#EFC7C8', borderRadius:'4px', padding:'6px 16px', fontSize:'14px', fontWeight:'400', letterSpacing:'0.01071em', lineHeight:'1.42'}}>
						<svg focusable="false" aria-hidden="true" viewBox="0 0 24 24" style={{width:'1em', height:'1em', color:'#D34038', fill:'currentColor', fontSize:'22px', margin:'7px 12px 7px 0'}}>
							<path d="M11 15h2v2h-2zm0-8h2v6h-2zm.99-5C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8z"></path>
						</svg>
						<div style={{padding:'8px 0'}}>
							{message}<br/>
							<br/>
							{reason}
						</div>
					</div>
					
					{!!retry && (<>
						<button onClick={() => retry()} className={cssId + '_button_tryagain'} style={{marginTop:'16px', padding:'11px 22px', fontWeight:'600', letterSpacing:'0.02857em', border:'0', borderRadius:'4px', cursor:'pointer'}}>
							TRY AGAIN
						</button>
					</>)}
				</div>
			</div>
		</div>
	</>);
});
