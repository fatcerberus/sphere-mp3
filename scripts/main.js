/**
 *  mp3 SoundStream Demo for Sphere
 *  (c) 2017-2021 Bruce Pascoe
 *
 *  Demonstrates playing back an mp3 file using the Sphere SoundStream class.
 *  Decoding is done entirely in JavaScript using the Aurora.js library.
**/

import { from, Prim, Thread } from 'sphere-runtime';

// setImmediate is needed for aurora.js to work
if (!('window' in globalThis)) {
	globalThis.window = globalThis;
	globalThis.setImmediate = callback => Dispatch.now(callback);
	globalThis.clearImmediate = token => token.cancel();
}

await File.run('scripts/aurora.js');
await File.run('scripts/mp3.js');

export default
class mp3Demo extends Thread
{
	async on_startUp()
	{
		const mp3Data = await File.load('music/chartreuseRewind.mp3', DataType.Raw);
		await new Promise(resolve => {
			this.asset = AV.Asset.fromBuffer(mp3Data);
			this.asset.get('format', format => {
				this.stream = new SoundStream(
					format.sampleRate, 32,  // 32-bit means float32
					format.channelsPerFrame);
				this.stream.play(Mixer.Default);
				this.asset.on('data', buffer => this.on_receiveData(buffer));
				this.asset.start();
				resolve();
			});
		});

		this.albumArt = await Texture.fromFile('images/theFelt.png');
		this.vu1 = 0.0;
		this.vu2 = 0.0;
	}
	
	on_receiveData(samples)
	{
		this.stream.write(samples);

		// calculate the current VU for this frame (for visualization)
		let amplitudeL = from(samples)
			.where((v, index) => index % 2 == 0)
			.aggregate((a, v) => Math.max(Math.abs(v), a), 0.0);
		let amplitudeR = from(samples)
			.where((v, index) => index % 2 == 1)
			.aggregate((a, v) => Math.max(Math.abs(v), a), 0.0);
		this.vu1 = (amplitudeL + this.vu1 * 4) / 5;
		this.vu2 = (amplitudeR + this.vu2 * 4) / 5;

		// for some reason Aurora.js doesn't yield to the event loop during
		// audio decoding, but we can coerce it into doing so.
		this.asset.stop();
	}

	on_render()
	{
		// calculate the lighting levels based on the current VU
		let blackLevel = 1.0 - (this.vu1 + this.vu2) / 2;
		let lightColor1 = Color.mix(Color.Chartreuse, Color.Black, this.vu1, 1.0 - this.vu1);
		let lightColor2 = Color.mix(Color.Chartreuse, Color.Black, this.vu2, 1.0 - this.vu2);

		// it's Felt Manor, of course ya gotta have green wallpaper!
		Prim.fill(Surface.Screen, new Color(0.0, 0.125, 0.0));

		// some nice framed artwork...
		let x = (Surface.Screen.width - this.albumArt.width) / 2;
		let y = (Surface.Screen.height - this.albumArt.height) / 2;
		Prim.blit(Surface.Screen, x, y, this.albumArt);

		// dim the lights and set the mood.
		Prim.fill(Surface.Screen, Color.Black.fadeTo(blackLevel));
		Prim.drawSolidRectangle(Surface.Screen, 0, 0, 200, Surface.Screen.height,
			lightColor1, Color.Transparent, Color.Transparent, lightColor1);
		Prim.drawSolidRectangle(Surface.Screen, Surface.Screen.width - 200, 0, 200, Surface.Screen.height,
			Color.Transparent, lightColor2, lightColor2, Color.Transparent);
	}

	on_update()
	{
		// resume the decoder if we have 100ms or less buffered.
		// this is cutting it rather close, but keeps the visualization
		// in sync with the screen without undue effort.
		if (this.stream.length <= 0.1)
			this.asset.start();
	}
}
