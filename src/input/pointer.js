/*
* MelonJS Game Engine
* Copyright (C) 2011 - 2018 Olivier Biot
* http://www.melonjs.org
*
*/

import Rect from "../shapes/rectangle";

/**
 * cache value for the offset of the canvas position within the page
 * @ignore
 */
var viewportOffset = new me.Vector2d();

/**
 * a pointer object, representing a single finger on a touch enabled device.
 * @class
 * @extends me.Rect
 * @memberOf me
 * @constructor
 */
export default class Pointer extends Rect {
/** @scope me.Pointer.prototype */
    /**
     * @ignore
     */
    constructor (x, y, w, h) {


        // parent constructor
        super(x || 0, y || 0, w || 1, h || 1);

       /**
        * the originating Event Object
        * @public
        * @type {PointerEvent|TouchEvent|MouseEvent}
        * @name event
        * @see https://developer.mozilla.org/en-US/docs/Web/API/PointerEvent
        * @see https://developer.mozilla.org/en-US/docs/Web/API/TouchEvent
        * @see https://developer.mozilla.org/en-US/docs/Web/API/MouseEvent
        * @memberOf me.Pointer
        */
        this.event = undefined;

       /**
        * a string containing the event's type.
        * @public
        * @type {String}
        * @name type
        * @see https://developer.mozilla.org/en-US/docs/Web/API/Event/type
        * @memberOf me.Pointer
        */
        this.type = undefined;


       /**
        * the button property indicates which button was pressed on the mouse to trigger the event.
        * @public
        * @type {Number}
        * @name width
        * @see https://developer.mozilla.org/en-US/docs/Web/API/MouseEvent/button
        * @memberOf me.Pointer
        */
        this.button = 0;

       /**
        * indicates whether or not the pointer device that created the event is the primary pointe.
        * @public
        * @type {Boolean}
        * @name width
        * @see https://developer.mozilla.org/en-US/docs/Web/API/PointerEvent/isPrimary
        * @memberOf me.Pointer
        */
        this.isPrimary = false;

       /**
        * the horizontal coordinate within the application's client area at which the event occurred
        * @public
        * @type {Number}
        * @name clientX
        * @see https://developer.mozilla.org/en-US/docs/Web/API/MouseEvent/clientX
        * @memberOf me.Pointer
        */
        this.clientX = undefined;

       /**
        * the vertical coordinate within the application's client area at which the event occurred
        * @public
        * @type {Number}
        * @name clientY
        * @see https://developer.mozilla.org/en-US/docs/Web/API/MouseEvent/clientY
        * @memberOf me.Pointer
        */
        this.clientY = undefined;

      /**
        * Event normalized X coordinate within the game canvas itself<br>
        * <img src="images/event_coord.png"/>
        * @public
        * @type {Number}
        * @name gameX
        * @memberOf me.Pointer
        */
        this.gameX = undefined;

       /**
        * Event normalized Y coordinate within the game canvas itself<br>
        * <img src="images/event_coord.png"/>
        * @public
        * @type {Number}
        * @name gameY
        * @memberOf me.Pointer
        */
        this.gameY = undefined;

       /**
        * Event X coordinate relative to the viewport
        * @public
        * @type {Number}
        * @name gameScreenX
        * @memberOf me.Pointer
        */
        this.gameScreenX = undefined;

       /**
        * Event Y coordinate relative to the viewport
        * @public
        * @type {Number}
        * @name gameScreenY
        * @memberOf me.Pointer
        */
        this.gameScreenY = undefined;

       /**
        * Event X coordinate relative to the map
        * @public
        * @type {Number}
        * @name gameWorldX
        * @memberOf me.Pointer
        */
        this.gameWorldX = undefined;

       /**
        * Event Y coordinate relative to the map
        * @public
        * @type {Number}
        * @name gameWorldY
        * @memberOf me.Pointer
        */
        this.gameWorldY = undefined;

       /**
        * Event X coordinate relative to the holding container
        * @public
        * @type {Number}
        * @name gameLocalX
        * @memberOf me.Pointer
        */
        this.gameLocalX = undefined;

       /**
        * Event Y coordinate relative to the holding container
        * @public
        * @type {Number}
        * @name gameLocalY
        * @memberOf me.Pointer
        */
        this.gameLocalY = undefined;

       /**
        * The unique identifier of the contact for a touch, mouse or pen
        * @public
        * @type {Number}
        * @name pointerId
        * @memberOf me.Pointer
        * @see https://developer.mozilla.org/en-US/docs/Web/API/PointerEvent/pointerId
        */
        this.pointerId = undefined;
    }

    /**
     * initialize the Pointer object using the given Event Object
     * @name me.Pointer#set
     * @private
     * @function
     * @param {Event} event the original Event object
     * @param {Number} clientX the horizontal coordinate within the application's client area at which the event occurred
     * @param {Number} clientX the vertical coordinate within the application's client area at which the event occurred
     * @param {Number} pointedId the Pointer, Touch or Mouse event Id
     */
    setEvent (event, clientX, clientY, pointerId) {
        var width = 1;
        var height = 1;

        // the original event object
        this.event = event;

        this.clientX = clientX || 0;
        this.clientY = clientY || 0;

        // translate to local coordinates
        me.input.globalToLocal(clientX, clientY, this.pos);

        // true if not originally a pointer event
        this.isNormalized = !me.device.PointerEvent || (me.device.PointerEvent && !(event instanceof window.PointerEvent));

        if (event.type === "wheel") {
            this.deltaMode = 1;
            this.deltaX = event.deltaX;
            this.deltaY = - 1 / 40 * event.wheelDelta;
            event.wheelDeltaX && (this.deltaX = - 1 / 40 * event.wheelDeltaX);
        }

        // could be 0, so test if defined
        this.pointerId = (typeof pointerId !== "undefined") ? pointerId : 1;

        this.isPrimary = (typeof event.isPrimary !== "undefined") ? event.isPrimary : true;

        // in case of touch events, button is not defined
        this.button = event.button || 0;

        this.type = event.type;

        this.gameScreenX = this.pos.x;
        this.gameScreenY = this.pos.y;

        // get the current screen to world offset
        me.game.viewport.localToWorld(this.gameScreenX, this.gameScreenY, viewportOffset);

        /* Initialize the two coordinate space properties. */
        this.gameWorldX = viewportOffset.x;
        this.gameWorldY = viewportOffset.y;

        // get the pointer size
        if (this.isNormalized === false) {
            // native PointerEvent
            width = event.width;
            height = event.height;
        } else if (typeof(event.radiusX) === "number")  {
            // TouchEvent
            width = event.radiusX * 2;
            height = event.radiusY * 2;
        }
        // resize the pointer object accordingly
        this.resize(width, height);
    }
};
