import {LeRed} from '@lowentry/react-redux';
import {LeUtils, ISSET, FLOAT_LAX, FLOAT_LAX_ANY} from '@lowentry/utils';


export const useFadeoutAnimation = (params) =>
{
	const {visible, delay, duration, decayFactor} = params;
	
	const opacityRef = LeRed.useRef(1);
	const [opacity, setOpacity] = LeRed.useState(1);
	
	const delayTimePassedRef = LeRed.useRef(0);
	
	
	LeRed.useEffect(() =>
	{
		if(visible)
		{
			delayTimePassedRef.current = 0;
			opacityRef.current = 1;
			setOpacity(1);
			return;
		}
		if(opacityRef.current <= 0)
		{
			return;
		}
		
		let timer = null;
		const startTime = performance.now();
		
		const stopTimer = () =>
		{
			delayTimePassedRef.current += performance.now() - startTime;
			try
			{
				timer?.remove();
				timer = null;
			}
			catch(e)
			{
				console.error('[PanoramaViewer] fadeout animation timer removal failed:', e);
			}
		};
		
		timer = LeUtils.setTimeout(() =>
		{
			if(!timer)
			{
				return;
			}
			timer = LeUtils.setAnimationFrameInterval(deltaTime =>
			{
				if(ISSET(decayFactor))
				{
					const before = opacityRef.current;
					const after = before * Math.pow(FLOAT_LAX(decayFactor), deltaTime);
					const dif = Math.max(before - after, deltaTime / 2);
					opacityRef.current -= dif;
				}
				else
				{
					opacityRef.current -= deltaTime / (FLOAT_LAX_ANY(duration, 1000) / 1000);
				}
				
				if(opacityRef.current < 0.001)
				{
					opacityRef.current = 0;
				}
				setOpacity(opacityRef.current);
				
				if(opacityRef.current <= 0)
				{
					stopTimer();
				}
			});
		}, Math.max(0, (delay ?? 0) - delayTimePassedRef.current));
		
		return stopTimer;
	}, [visible, delay, duration, decayFactor]);
	
	
	return {opacity};
};
