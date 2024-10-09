import React from 'react';
import {LeRed} from '@lowentry/react-redux';
import {LeUtils} from '@lowentry/utils';
import {PanoramaRenderingLayer, PanoramaRenderingLayerFullFadeTimeMs} from './PanoramaRenderingLayer.jsx';


export const PanoramaRendererLayers = LeRed.memo(({src, styleIndex, locationIndex}) =>
{
	const currentLayersRef = LeRed.useRef([]);
	const [currentLayers, setCurrentLayers] = LeRed.useState([]);
	
	
	LeRed.useEffect(() =>
	{
		/** create a lookup table **/
		let newSrc = {};
		LeUtils.each(src, (item, index) =>
		{
			newSrc[item.basePath] = item;
		});
		
		
		/** dispose layers that are not in the new src **/
		LeUtils.each(currentLayersRef.current, (layer, index) =>
		{
			if(!layer.visible)
			{
				/** already being disposed **/
				return;
			}
			
			if(newSrc[layer.src.basePath])
			{
				/** exists, don't dispose **/
				delete newSrc[layer.src.basePath];
				return;
			}
			
			/** removed, dispose **/
			
			layer.visible = false;
			layer.visibleLastTime = performance.now();
			
			LeUtils.setTimeout(() =>
			{
				currentLayersRef.current = currentLayersRef.current.filter(item => (item.key !== layer.key));
				setCurrentLayers([...currentLayersRef.current]);
				LeUtils.setAnimationFrameTimeout(() =>
				{
					layer.src.dispose();
				}, 10);
			}, PanoramaRenderingLayerFullFadeTimeMs);
		});
		
		
		/** add new layers **/
		LeUtils.each(newSrc, (item, basePath) =>
		{
			currentLayersRef.current.push({key:LeUtils.uniqueId(), src:item, visible:true});
		});
		
		
		/** sort the layers, in render order **/
		/** the one that is fading out, has to be rendered on top (rendered later) **/
		const A = -1; // render a first, meaning it will be rendered below B
		const B = 1; // render b first, meaning it will be rendered below A
		currentLayersRef.current.sort((a, b) =>
		{
			if(a.src.styleIndex !== b.src.styleIndex)
			{
				if(a.src.styleIndex === styleIndex)
				{
					return A;
				}
				return B;
			}
			if(a.src.locationIndex !== b.src.locationIndex)
			{
				if(a.src.locationIndex === locationIndex)
				{
					return A;
				}
				return B;
			}
			if(a.src.layerRenderOrder < b.src.layerRenderOrder)
			{
				return A;
			}
			if(a.src.layerRenderOrder > b.src.layerRenderOrder)
			{
				return B;
			}
			if(!a.visible && !b.visible)
			{
				if(a.visibleLastTime > b.visibleLastTime)
				{
					return A;
				}
				if(a.visibleLastTime < b.visibleLastTime)
				{
					return B;
				}
				return 0;
			}
			if(!a.visible)
			{
				return B;
			}
			if(!b.visible)
			{
				return A;
			}
			return 0;
		});
		setCurrentLayers([...currentLayersRef.current]);
	}, [src, styleIndex, locationIndex]);
	
	
	return (<>
		{LeUtils.mapToArray(currentLayers, (layer, index) => (
			<PanoramaRenderingLayer key={layer.key} src={layer.src} visible={layer.visible} renderOrder={index}/>
		))}
	</>);
});
