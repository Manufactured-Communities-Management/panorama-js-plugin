import React from 'react';
import {PanoramaRenderer} from '../rendering/PanoramaRenderer.jsx';


export const PanoramaLoaderVariationsParser = ({src = undefined, styleIndex:givenStyleIndex = undefined, locationIndex:givenLocationIndex = undefined, ...props}) =>
{
	return (<>
		<PanoramaRenderer {...props}/>
	</>);
};
