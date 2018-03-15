/*
* MelonJS Game Engine
* Copyright (C) 2011 - 2018 Olivier Biot
* http://www.melonjs.org
*
*/

import Renderable from "../renderable/renderable";

/**
 * a Generic Object Entity<br>
 * @class
 * @extends me.Renderable
 * @memberOf me
 * @constructor
 * @param {Number} x the x coordinates of the entity object
 * @param {Number} y the y coordinates of the entity object
 * @param {Object} settings Entity properties, to be defined through Tiled or when calling the entity constructor
 * <img src="images/object_properties.png"/>
 * @param {Number} settings.width the physical width the entity takes up in game
 * @param {Number} settings.height the physical height the entity takes up in game
 * @param {String} [settings.name] object entity name
 * @param {String} [settings.id] object unique IDs
 * @param {Image|String} [settings.image] resource name of a spritesheet to use for the entity renderable component
 * @param {Number} [settings.framewidth] width of a single frame in the given spritesheet
 * @param {Number} [settings.frameheight] height of a single frame in the given spritesheet
 * @param {String} [settings.type] object type
 * @param {Number} [settings.collisionMask] Mask collision detection for this object
 * @param {me.Rect[]|me.Polygon[]|me.Line[]|me.Ellipse[]} [settings.shapes] the initial list of collision shapes (usually populated through Tiled)
 */

export default class Entity extends Renderable {

    /** @ignore */
    constructor(x, y, settings) {

        // ensure mandatory properties are defined
        if ((typeof settings.width !== "number") || (typeof settings.height !== "number")) {
            throw new Error("me.Entity: height and width properties are mandatory when passing settings parameters to an object entity");
        }

        // call the super constructor
        super(x, y, settings.width, settings.height);


        /**
         * The array of renderable children of this entity.
         * @ignore
         */
        this.children = [];

        if (settings.image) {
            this.renderable = new me.Sprite(0, 0, {
                "image" : settings.image,
                "framewidth" : ~~(settings.framewidth || settings.width),
                "frameheight" : ~~(settings.frameheight || settings.height),
                "spacing" : ~~settings.spacing,
                "margin" : ~~settings.margin,
                "anchorPoint" : settings.anchorPoint
            });
        }

        // Update anchorPoint
        if (settings.anchorPoint) {
            this.anchorPoint.set(settings.anchorPoint.x, settings.anchorPoint.y);
        }

        /**
         * Entity name<br>
         * as defined in the Tiled Object Properties
         * @public
         * @type String
         * @name name
         * @memberOf me.Entity
         */
        this.name = settings.name || "";

        /**
         * object type (as defined in Tiled)
         * @public
         * @type String
         * @name type
         * @memberOf me.Entity
         */
        this.type = settings.type || "";

        /**
         * object unique ID (as defined in Tiled)
         * @public
         * @type Number
         * @name id
         * @memberOf me.Entity
         */
        this.id = settings.id || "";

        /**
         * dead/living state of the entity<br>
         * default value : true
         * @public
         * @type Boolean
         * @name alive
         * @memberOf me.Entity
         */
        this.alive = true;

        /**
         * the entity body object
         * @public
         * @type me.Body
         * @name body
         * @memberOf me.Entity
         */
        // initialize the default body
        var shapes = (
            Array.isArray(settings.shapes) ?
            settings.shapes :
            [ new me.Rect(0, 0, this.width, this.height) ]
        );
        if (typeof this.body !== "undefined") {
            this.body.init(this, shapes, this.onBodyUpdate.bind(this));
        }
        else {
            this.body = new me.Body(this, shapes, this.onBodyUpdate.bind(this));
        }

        // resize the entity if required
        if (this.width === 0 && this.height === 0) {
            this.resize(this.body.width, this.body.height);
        }

        // set the  collision mask if defined
        if (typeof(settings.collisionMask) !== "undefined") {
            this.body.setCollisionMask(settings.collisionMask);
        }

        // set the  collision mask if defined
        if (typeof(settings.collisionType) !== "undefined") {
            if (typeof me.collision.types[settings.collisionType] !== "undefined") {
                this.body.collisionType = me.collision.types[settings.collisionType];
            } else {
                throw new Error("me.Entity: Invalid value for the collisionType property");
            }
        }

        // disable for entities
        this.autoTransform = false;

        // enable collision detection
        this.isKinematic = false;
    }

    /**
     * The entity renderable component (can be any objects deriving from me.Renderable, like me.Sprite for example)
     * @public
     * @type me.Renderable
     * @name renderable
     * @memberOf me.Entity
     */
    get renderable()
    {
       return this.children[0];
    }

    /**
     * @ignore
     */
    set renderable(value)
    {
        if (value instanceof me.Renderable) {
            this.children[0] = value;
        } else {
            throw Error("me.Entity: " + value + "should extend me.Renderable");
        }
    }

    /**
     * return the distance to the specified entity
     * @name distanceTo
     * @memberOf me.Entity
     * @function
     * @param {me.Entity} entity Entity
     * @return {Number} distance
     */
    distanceTo(e) {
        var a = this.getBounds();
        var b = e.getBounds();
        // the me.Vector2d object also implements the same function, but
        // we have to use here the center of both entities
        var dx = (a.pos.x + (a.width / 2))  - (b.pos.x + (b.width / 2));
        var dy = (a.pos.y + (a.height / 2)) - (b.pos.y + (b.height / 2));
        return Math.sqrt(dx * dx + dy * dy);
    }

    /**
     * return the distance to the specified point
     * @name distanceToPoint
     * @memberOf me.Entity
     * @function
     * @param {me.Vector2d} vector vector
     * @return {Number} distance
     */
    distanceToPoint(v) {
        var a = this.getBounds();
        // the me.Vector2d object also implements the same function, but
        // we have to use here the center of both entities
        var dx = (a.pos.x + (a.width / 2))  - (v.x);
        var dy = (a.pos.y + (a.height / 2)) - (v.y);
        return Math.sqrt(dx * dx + dy * dy);
    }

    /**
     * return the angle to the specified entity
     * @name angleTo
     * @memberOf me.Entity
     * @function
     * @param {me.Entity} entity Entity
     * @return {Number} angle in radians
     */
    angleTo(e) {
        var a = this.getBounds();
        var b = e.getBounds();
        // the me.Vector2d object also implements the same function, but
        // we have to use here the center of both entities
        var ax = (b.pos.x + (b.width / 2)) - (a.pos.x + (a.width / 2));
        var ay = (b.pos.y + (b.height / 2)) - (a.pos.y + (a.height / 2));
        return Math.atan2(ay, ax);
    }

    /**
     * return the angle to the specified point
     * @name angleToPoint
     * @memberOf me.Entity
     * @function
     * @param {me.Vector2d} vector vector
     * @return {Number} angle in radians
     */
    angleToPoint(v) {
        var a = this.getBounds();
        // the me.Vector2d object also implements the same function, but
        // we have to use here the center of both entities
        var ax = (v.x) - (a.pos.x + (a.width / 2));
        var ay = (v.y) - (a.pos.y + (a.height / 2));
        return Math.atan2(ay, ax);
    }

    /** @ignore */
    update(dt) {
        if (this.renderable) {
            return this.renderable.update(dt);
        }
        return super(dt);
    }

    /**
     * update the bounds position when the position is modified
     * @private
     * @name updateBoundsPos
     * @memberOf me.Entity
     * @function
     */
    updateBoundsPos(x, y) {
        if (typeof this.body !== "undefined") {
            var _pos = this.body.pos;
            super(x + _pos.x, y + _pos.y);
        } else {
            super(x, y);
        }
        return this.getBounds();
    }

    /**
     * update the bounds position when the body is modified
     * @private
     * @name onBodyUpdate
     * @memberOf me.Entity
     * @function
     */
    onBodyUpdate(body) {
        // update the entity bounds to match with the body bounds
        this.getBounds().resize(body.width, body.height);
        // update the bounds pos
        this.updateBoundsPos(this.pos.x, this.pos.y);
    }

    preDraw(renderer) {
        renderer.save();

        // translate to the entity position
        renderer.translate(
            this.pos.x + this.body.pos.x,
            this.pos.y + this.body.pos.y
        );

        if (this.renderable instanceof me.Renderable) {
            // draw the child renderable's anchorPoint at the entity's
            // anchor point.  the entity's anchor point is a scale from
            // body position to body width/height
            renderer.translate(
                this.anchorPoint.x * this.body.width,
                this.anchorPoint.y * this.body.height
            );
        }
    }

    /**
     * object draw<br>
     * not to be called by the end user<br>
     * called by the game manager on each game loop
     * @name draw
     * @memberOf me.Entity
     * @function
     * @protected
     * @param {me.CanvasRenderer|me.WebGLRenderer} renderer a renderer object
     * @param {me.Rect} region to draw
     **/
    draw(renderer, rect) {
        var renderable = this.renderable;
        if (renderable instanceof me.Renderable) {
            // predraw (apply transforms)
            renderable.preDraw(renderer);

            // draw the object
            renderable.draw(renderer, rect);

            // postdraw (clean-up);
            renderable.postDraw(renderer);
        }
    }

    /**
     * Destroy function<br>
     * @ignore
     */
    destroy() {
        // free some property objects
        if (this.renderable) {
            this.renderable.destroy.apply(this.renderable, arguments);
            this.children.splice(0, 1);
        }

        // call the parent destroy method
        super(arguments);
    }

    /**
     * onDeactivateEvent Notification function<br>
     * Called by engine before deleting the object
     * @name onDeactivateEvent
     * @memberOf me.Entity
     * @function
     */
    onDeactivateEvent() {
      if (this.renderable && this.renderable.onDeactivateEvent) {
          this.renderable.onDeactivateEvent();
      }
    }

    /**
     * onCollision callback<br>
     * triggered in case of collision, when this entity body is being "touched" by another one<br>
     * @name onCollision
     * @memberOf me.Entity
     * @function
     * @param {me.collision.ResponseObject} response the collision response object
     * @param {me.Entity} other the other entity touching this one (a reference to response.a or response.b)
     * @return {Boolean} true if the object should respond to the collision (its position and velocity will be corrected)
     */
    onCollision() {
        return false;
    }
};
