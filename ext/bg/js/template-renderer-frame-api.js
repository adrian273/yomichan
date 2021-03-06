/*
 * Copyright (C) 2020-2021  Yomichan Authors
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
 */

class TemplateRendererFrameApi {
    constructor(templateRenderer) {
        this._templateRenderer = templateRenderer;
        this._windowMessageHandlers = new Map([
            ['render', {async: true, handler: this._onRender.bind(this)}]
        ]);
    }

    prepare() {
        window.addEventListener('message', this._onWindowMessage.bind(this), false);
    }

    // Private

    _onWindowMessage(e) {
        const {source, data: {action, params, id}} = e;
        const messageHandler = this._windowMessageHandlers.get(action);
        if (typeof messageHandler === 'undefined') { return; }

        this._onWindowMessageInner(messageHandler, action, params, source, id);
    }

    async _onWindowMessageInner({handler, async}, action, params, source, id) {
        let response;
        try {
            let result = handler(params);
            if (async) {
                result = await result;
            }
            response = {result};
        } catch (error) {
            response = {error: this._errorToJson(error)};
        }

        if (typeof id === 'undefined') { return; }
        source.postMessage({action: `${action}.response`, params: response, id}, '*');
    }

    async _onRender({template, data, type}) {
        return await this._templateRenderer.render(template, data, type);
    }

    _errorToJson(error) {
        try {
            if (error !== null && typeof error === 'object') {
                return {
                    name: error.name,
                    message: error.message,
                    stack: error.stack,
                    data: error.data
                };
            }
        } catch (e) {
            // NOP
        }
        return {
            value: error,
            hasValue: true
        };
    }
}
