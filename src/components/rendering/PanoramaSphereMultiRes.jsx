import {LeRed} from '@lowentry/react-redux';
import {ISSET} from '@lowentry/utils';
import {useThree} from '@react-three/fiber';
import {dispose, loadTextures} from '../utils/PanoramaRendererUtils';
import {PanoramaSphereWithLoadTextures} from './PanoramaSphereWithLoadTextures';


export const PanoramaSphereMultiRes = LeRed.memo(({radius, textures, maskTextures}) =>
{
	const {gl} = useThree();
	const [level, setLevel] = LeRed.useState(0);
	const [loadedTextures, setLoadedTextures] = LeRed.useState(null);
	const [loadedMaskTextures, setLoadedMaskTextures] = LeRed.useState(null);
	
	
	LeRed.useEffect(() =>
	{
		setLevel(0);
		setLoadedTextures(null);
		setLoadedMaskTextures(null);
	}, [textures, maskTextures]);
	
	
	LeRed.useEffect(() =>
	{
		if(!gl || !textures)
		{
			return;
		}
		
		let cancel = false;
		let newLoadedTextures = null;
		let newLoadedMaskTextures = null;
		(async () =>
		{
			try
			{
				if(!ISSET(textures[level]))
				{
					// no more levels
					return;
				}
				
				newLoadedTextures = await loadTextures(gl, textures[level]);
				if(cancel)
				{
					dispose(newLoadedTextures, newLoadedMaskTextures);
					return;
				}
				
				newLoadedMaskTextures = !maskTextures ? null : await loadTextures(gl, maskTextures[level]);
				if(cancel)
				{
					dispose(newLoadedTextures, newLoadedMaskTextures);
					return;
				}
				
				setLoadedTextures(newLoadedTextures);
				setLoadedMaskTextures(newLoadedMaskTextures);
				setLevel(level + 1);
			}
			catch(e)
			{
				console.error('[PanoramaViewer] PanoramaSphereMultiRes texture loading failed:', e);
			}
		})();
		
		return () =>
		{
			cancel = true;
			dispose(newLoadedTextures, newLoadedMaskTextures);
		};
	}, [gl, textures, level]);
	
	
	return (<PanoramaSphereWithLoadTextures radius={radius} textures={loadedTextures} maskTextures={loadedMaskTextures}/>);
});
