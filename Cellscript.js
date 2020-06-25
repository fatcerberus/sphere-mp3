/*
 *  mp3 SoundStream Demo for Sphere
 *  (c) 2017 Bruce Pascoe
 *
 *  Demonstrates playing back an mp3 file using the Sphere v2 SoundStream
 *  class.  mp3 decoding is done entirely in JavaScript using the Aurora.js
 *  library!
 */

Object.assign(Sphere.Game,
{
	version: 2, apiLevel: 1,

	name: "mp3 SoundStream Demo",
	author: "Bruce Pascoe",
	summary: "",
	resolution: '1024x768',

	main: 'scripts/main.js',
	fullScreen: true,
});

install('@/scripts', files('src/*.js', true));
install('@/images', files('images/*.png', true));
install('@/music',  files('music/*.mp3', true));

install('@/', files('icon.png'));
