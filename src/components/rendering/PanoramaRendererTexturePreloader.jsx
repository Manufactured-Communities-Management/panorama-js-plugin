import React from 'react';
import {LeRed} from '@lowentry/react-redux';
import {LeUtils, STRING} from '@lowentry/utils';
import {useThree} from '@react-three/fiber';
import {PanoramaRendererLayers} from './PanoramaRendererLayers.jsx';
import {loadMultiresTexture} from '../utils/PanoramaRendererUtils.jsx';
import {PanoramaRenderingLayerMinimumLoadTime} from './PanoramaRenderingLayer.jsx';


export const PanoramaRendererTexturePreloader = LeRed.memo(({src, homeId, host, homeUrl, basisTranscoderPath, setError, setLoading}) =>
{
	const {gl} = useThree();
	
	const currentLayersRef = LeRed.useRef([]);
	const [currentLayers, setCurrentLayers] = LeRed.useState([]);
	
	const readyLayersRef = LeRed.useRef([]);
	const [readyLayers, setReadyLayers] = LeRed.useState([]);
	
	
	LeRed.useEffect(() =>
	{
		if(!gl)
		{
			return;
		}
		
		
		/** create a lookup table **/
		let newSrc = {};
		LeUtils.each(src, (item, index) =>
		{
			newSrc[item.basePath] = item;
		});
		
		
		/** dispose layers that are not in the new src **/
		LeUtils.each(currentLayersRef.current, (layer, index) =>
		{
			if(newSrc[layer.src.basePath])
			{
				/** exists, don't dispose **/
				delete newSrc[layer.src.basePath];
				return;
			}
			
			/** removed, dispose **/
			layer.removed = true;
			currentLayersRef.current = currentLayersRef.current.filter(item => (item.key !== layer.key));
			
			/** if not in readyLayers, dispose textures now **/
			if(!readyLayersRef.current.find(item => (item.key === layer.key)))
			{
				layer.src.dispose();
			}
		});
		
		
		/** add new layers **/
		LeUtils.each(newSrc, (item, basePath) =>
		{
			let layer = {key:LeUtils.uniqueId()};
			const onLoadingError = ({level, error}) =>
			{
				if(!layer.removed && (level <= 0))
				{
					setError({canRetry:true, id:'could-not-load-home', message:'Couldn\'t load the home: ' + homeId, reason:STRING(LeUtils.purgeErrorMessage(error)), data:{homeId, host, homeUrl}});
				}
			};
			const loader = loadMultiresTexture({gl, basePath:item.basePath, maskBasePath:item.maskBasePath, basisTranscoderPath, minimumLoadTime:(readyLayersRef.current.length <= 0) ? 0 : PanoramaRenderingLayerMinimumLoadTime, onLoadingLevelFail:onLoadingError});
			if(loader)
			{
				layer.src = {...item, ...loader};
				currentLayersRef.current.push(layer);
			}
		});
		
		
		setCurrentLayers([...currentLayersRef.current]);
	}, [gl, src]);
	
	
	LeRed.useEffect(() =>
	{
		const timer = LeUtils.setAnimationFrameInterval(() =>
		{
			let ready = true;
			LeUtils.each(currentLayers, (layer, index) =>
			{
				if(!layer.src.isReady(0))
				{
					ready = false;
					return false;
				}
			});
			
			if(ready)
			{
				readyLayersRef.current = [...currentLayers];
				setReadyLayers(readyLayersRef.current);
				timer.remove();
			}
		});
		return timer.remove;
	}, [currentLayers]);
	
	
	LeRed.useEffect(() =>
	{
		setLoading((readyLayers.length <= 0));
	}, [(readyLayers.length <= 0)]);
	
	
	LeRed.useEffect(() =>
	{
		return () =>
		{
			/** cleanup **/
			LeUtils.each(currentLayersRef.current, (layer, index) =>
			{
				layer.removed = true;
				layer.src.dispose();
			});
			currentLayersRef.current = [];
			readyLayersRef.current = [];
			setCurrentLayers([]);
			setReadyLayers([]);
		};
	}, []);
	
	
	if(readyLayers.length <= 0)
	{
		return;
	}
	
	return (<>
		<PanoramaRendererLayers src={LeUtils.mapToArray(readyLayers, layer => layer.src)}/>
	</>);
});
