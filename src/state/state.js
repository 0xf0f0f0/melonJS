/*
* MelonJS Game Engine
* Copyright (C) 2011 - 2018 Olivier Biot
* http://www.melonjs.org
*
*/

// current state
let _state = -1;

// requestAnimeFrame Id
let _animFrameId = -1;

// whether the game state is "paused"
let _isPaused = false;

// list of screenObject
let _screenObject = {};

// fading transition parameters between screen
let _fade = {
    color : "",
    duration : 0
};

// callback when state switch is done
/** @ignore */
let _onSwitchComplete = null;

// just to keep track of possible extra arguments
let _extraArgs = null;

// store the elapsed time during pause/stop period
let _pauseTime = 0;

/**
 * @ignore
 */
let _startRunLoop = function() {
    // ensure nothing is running first and in valid state
    if ((_animFrameId === -1) && (_state !== -1)) {
        // reset the timer
        me.timer.reset();

        // start the main loop
        _animFrameId = window.requestAnimationFrame(_renderFrame);
    }
}

/**
 * Resume the game loop after a pause.
 * @ignore
 */
let _resumeRunLoop = function() {
    // ensure game is actually paused and in valid state
    if (_isPaused && (_state !== -1)) {
        // reset the timer
        me.timer.reset();

        _isPaused = false;
    }
}

/**
 * Pause the loop for most screen objects.
 * @ignore
 */
let _pauseRunLoop = function() {
    // Set the paused boolean to stop updates on (most) entities
    _isPaused = true;
}

/**
 * this is only called when using requestAnimFrame stuff
 * @param {Number} time current timestamp in milliseconds
 * @ignore
 */
let _renderFrame = function(time) {
    // update all game objects
    me.game.update(time);
    // render all game objects
    me.game.draw();
    // schedule the next frame update
    if (_animFrameId !== -1) {
        _animFrameId = window.requestAnimationFrame(_renderFrame);
    }
}

/**
 * stop the SO main loop
 * @ignore
 */
let _stopRunLoop = function() {
    // cancel any previous animationRequestFrame
    window.cancelAnimationFrame(_animFrameId);
    _animFrameId = -1;
}

/**
 * start the SO main loop
 * @ignore
 */
let _switchState = function(state) {
    // clear previous interval if any
    _stopRunLoop();

    // call the screen object destroy method
    if (_screenObject[_state]) {
        // just notify the object
        _screenObject[_state].screen.destroy();
    }

    if (_screenObject[state]) {
        // set the global variable
        _state = state;

        // call the reset function with _extraArgs as arguments
        _screenObject[_state].screen.reset.apply(_screenObject[_state].screen, _extraArgs);

        // and start the main loop of the
        // new requested state
        _startRunLoop();

        // execute callback if defined
        if (_onSwitchComplete) {
            _onSwitchComplete();
        }

        // force repaint
        me.game.repaint();
    }
}

/**
 * a State Manager (state machine)
 * @namespace me.state
 * @memberOf me
 */

/**
 * default state ID for Loading Screen
 * @constant
 * @name LOADING
 * @memberOf me.state
 */
export const LOADING = 0;

/**
 * default state ID for Menu Screen
 * @constant
 * @name MENU
 * @memberOf me.state
 */
export const MENU = 1;

/**
 * default state ID for "Ready" Screen
 * @constant
 * @name READY
 * @memberOf me.state
 */
export const READY = 2;

/**
 * default state ID for Play Screen
 * @constant
 * @name PLAY
 * @memberOf me.state
 */
export const PLAY = 3;

/**
 * default state ID for Game Over Screen
 * @constant
 * @name GAMEOVER
 * @memberOf me.state
 */
export const GAMEOVER = 4

/**
 * default state ID for Game End Screen
 * @constant
 * @name GAME_END
 * @memberOf me.state
 */
export const GAME_END = 5;

/**
 * default state ID for High Score Screen
 * @constant
 * @name SCORE
 * @memberOf me.state
 */
export const SCORE = 6;

/**
 * default state ID for Credits Screen
 * @constant
 * @name CREDITS
 * @memberOf me.state
 */
export const CREDITS = 7;

/**
 * default state ID for Settings Screen
 * @constant
 * @name SETTINGS
 * @memberOf me.state
 */
export const SETTINGS = 8;

/**
 * default state ID for user defined constants<br>
 * @constant
 * @name USER
 * @memberOf me.state
 * @example
 * var STATE_INFO = me.state.USER + 0;
 * var STATE_WARN = me.state.USER + 1;
 * var STATE_ERROR = me.state.USER + 2;
 * var STATE_CUTSCENE = me.state.USER + 3;
 */
export const USER = 100;


/**
 * onPause callback
 * @function
 * @name onPause
 * @memberOf me.state
 */
export let onPause = null;

/**
 * onResume callback
 * @function
 * @name onResume
 * @memberOf me.state
 */
export let onResume = null;

/**
 * onStop callback
 * @function
 * @name onStop
 * @memberOf me.state
 */
export let onStop = null;

/**
 * onRestart callback
 * @function
 * @name onRestart
 * @memberOf me.state
 */
export let onRestart = null;

/**
 * @ignore
 */
export function init () {
    // set the embedded loading screen
    set(LOADING, new me.DefaultLoadingScreen());
};

/**
 * Stop the current screen object.
 * @name stop
 * @memberOf me.state
 * @public
 * @function
 * @param {Boolean} pauseTrack pause current track on screen stop.
 */
export function stop (music) {
    // only stop when we are not loading stuff
    if ((_state !== LOADING) && isRunning()) {
        // stop the main loop
        _stopRunLoop();
        // current music stop
        if (music === true) {
            me.audio.pauseTrack();
        }

        // store time when stopped
        _pauseTime = window.performance.now();

        // publish the stop notification
        me.event.publish(me.event.STATE_STOP);
        // any callback defined ?
        if (typeof(onStop) === "function") {
            onStop();
        }
    }
};

/**
 * pause the current screen object
 * @name pause
 * @memberOf me.state
 * @public
 * @function
 * @param {Boolean} pauseTrack pause current track on screen pause
 */
export function pause (music) {
    // only pause when we are not loading stuff
    if ((_state !== LOADING) && !isPaused()) {
        // stop the main loop
        _pauseRunLoop();
        // current music stop
        if (music === true) {
            me.audio.pauseTrack();
        }

        // store time when paused
        _pauseTime = window.performance.now();

        // publish the pause event
        me.event.publish(me.event.STATE_PAUSE);
        // any callback defined ?
        if (typeof(onPause) === "function") {
            onPause();
        }
    }
};

/**
 * Restart the screen object from a full stop.
 * @name restart
 * @memberOf me.state
 * @public
 * @function
 * @param {Boolean} resumeTrack resume current track on screen resume
 */
export function restart (music) {
    if (!isRunning()) {
        // restart the main loop
        _startRunLoop();
        // current music stop
        if (music === true) {
            me.audio.resumeTrack();
        }

        // calculate the elpased time
        _pauseTime = window.performance.now() - _pauseTime;

        // force repaint
        me.game.repaint();

        // publish the restart notification
        me.event.publish(me.event.STATE_RESTART, [ _pauseTime ]);
        // any callback defined ?
        if (typeof(onRestart) === "function") {
            onRestart();
        }
    }
};

/**
 * resume the screen object
 * @name resume
 * @memberOf me.state
 * @public
 * @function
 * @param {Boolean} resumeTrack resume current track on screen resume
 */
export function resume (music) {
    if (isPaused()) {
        // resume the main loop
        _resumeRunLoop();
        // current music stop
        if (music === true) {
            me.audio.resumeTrack();
        }

        // calculate the elpased time
        _pauseTime = window.performance.now() - _pauseTime;

        // publish the resume event
        me.event.publish(me.event.STATE_RESUME, [ _pauseTime ]);
        // any callback defined ?
        if (typeof(onResume) === "function") {
            onResume();
        }
    }
};

/**
 * return the running state of the state manager
 * @name isRunning
 * @memberOf me.state
 * @public
 * @function
 * @return {Boolean} true if a "process is running"
 */
export function isRunning () {
    return _animFrameId !== -1;
};

/**
 * Return the pause state of the state manager
 * @name isPaused
 * @memberOf me.state
 * @public
 * @function
 * @return {Boolean} true if the game is paused
 */
export function isPaused () {
    return _isPaused;
};

/**
 * associate the specified state with a screen object
 * @name set
 * @memberOf me.state
 * @public
 * @function
 * @param {Number} state State ID (see constants)
 * @param {me.ScreenObject} so Instantiated ScreenObject to associate
 * with state ID
 * @example
 * var MenuButton = me.GUI_Object.extend({
 *     "onClick" : function () {
 *         // Change to the PLAY state when the button is clicked
 *         me.state.change(me.state.PLAY);
 *         return true;
 *     }
 * });
 *
 * var MenuScreen = me.ScreenObject.extend({
 *     onResetEvent: function() {
 *         // Load background image
 *         me.game.world.addChild(
 *             new me.ImageLayer(0, 0, {
 *                 image : "bg",
 *                 z: 0 // z-index
 *             }
 *         );
 *
 *         // Add a button
 *         me.game.world.addChild(
 *             new MenuButton(350, 200, { "image" : "start" }),
 *             1 // z-index
 *         );
 *
 *         // Play music
 *         me.audio.playTrack("menu");
 *     },
 *
 *     "onDestroyEvent" : function () {
 *         // Stop music
 *         me.audio.stopTrack();
 *     }
 * });
 *
 * me.state.set(me.state.MENU, new MenuScreen());
 */
export function set (state, so) {
    if (!(so instanceof me.ScreenObject)) {
        throw new me.Error(so + " is not an instance of me.ScreenObject");
    }
    _screenObject[state] = {};
    _screenObject[state].screen = so;
    _screenObject[state].transition = true;
};

/**
 * return a reference to the current screen object<br>
 * useful to call a object specific method
 * @name current
 * @memberOf me.state
 * @public
 * @function
 * @return {me.ScreenObject}
 */
export function current () {
    return _screenObject[_state].screen;
};

/**
 * specify a global transition effect
 * @name transition
 * @memberOf me.state
 * @public
 * @function
 * @param {String} effect (only "fade" is supported for now)
 * @param {me.Color|String} color a CSS color value
 * @param {Number} [duration=1000] expressed in milliseconds
 */
export function transition (effect, color, duration) {
    if (effect === "fade") {
        _fade.color = color;
        _fade.duration = duration;
    }
};

/**
 * enable/disable transition for a specific state (by default enabled for all)
 * @name setTransition
 * @memberOf me.state
 * @public
 * @function
 * @param {Number} state State ID (see constants)
 * @param {Boolean} enable
 */
export function setTransition (state, enable) {
    _screenObject[state].transition = enable;
};

/**
 * change the game/app state
 * @name change
 * @memberOf me.state
 * @public
 * @function
 * @param {Number} state State ID (see constants)
 * @param {} [arguments...] extra arguments to be passed to the reset functions
 * @example
 * // The onResetEvent method on the play screen will receive two args:
 * // "level_1" and the number 3
 * me.state.change(me.state.PLAY, "level_1", 3);
 */
export function change (state) {
    // Protect against undefined ScreenObject
    if (typeof(_screenObject[state]) === "undefined") {
        throw new me.Error("Undefined ScreenObject for state '" + state + "'");
    }

    if (isCurrent(state)) {
        // do nothing if already the current state
        return;
    }

    _extraArgs = null;
    if (arguments.length > 1) {
        // store extra arguments if any
        _extraArgs = Array.prototype.slice.call(arguments, 1);
    }
    // if fading effect
    if (_fade.duration && _screenObject[state].transition) {
        /** @ignore */
        _onSwitchComplete = function () {
            me.game.viewport.fadeOut(_fade.color, _fade.duration);
        };
        me.game.viewport.fadeIn(
            _fade.color,
            _fade.duration,
            function () {
                me.utils.function.defer(_switchState, this, state);
            }
        );

    }
    // else just switch without any effects
    else {
        // wait for the last frame to be
        // "finished" before switching
        me.utils.function.defer(_switchState, this, state);
    }
};

/**
 * return true if the specified state is the current one
 * @name isCurrent
 * @memberOf me.state
 * @public
 * @function
 * @param {Number} state State ID (see constants)
 */
export function isCurrent (state) {
    return _state === state;
};
