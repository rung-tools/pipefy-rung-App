import {
    contains,
    curry,
    filter,
    map,
    replace,
    startsWith,
    toLower,
    toUpper,
    when,
    where
} from 'ramda'
import { getToken } from './token'

/**
 * Converts a locale string using dashes to one using underscore and
 * uppercases suffix
 * @param {String}
 * @return {String}
 */
const convertLocale = replace(/\-(\w+)/, (rest, dialect) => `_${toUpper(dialect)}`)

/**
 * Displays the dropdown with entry to authenticate. When clicked,
 * show Rung modal to use Rung oAuth and receive the Rung token
 * to install apps
 */
const showAuthenticationDropdown = pipefy =>
    pipefy.dropdown({
        title: 'Rung',
        items: [
            {
                title: 'Authorize Rung',
                callback: result => console.log(result)
            }
        ]
    })

/**
 * Shows modal to install app
 *
 * @param {String} name
 * @param {Pipefy} pipefy
 * @return {Promise}
 */
const showAppModal = (name, pipefy) =>
    pipefy.modal({
        url: 'airbnb',
        height: '540px',
        width: '900px'
    })

/**
 * Displays the dropdown to search apps from a category. Opens installation
 * modal when done.
 *
 * @param {String} alias - Category alias to lookup
 * @param {Pipefy} pipefy
 * @return {Promise}
 */
const showAppSearch = curry((alias, pipefy) =>
    pipefy.search({
        title: 'Select app',
        placeholder: 'Search apps',
        loading: 'Loading apps',
        empty: 'No app found',
        items: (client, query) => fetch(`https://app.rung.com.br/api/extensions/category/${alias}?lang=${convertLocale(pipefy.locale)}`)
            .then(_.json())
            .then(
                map(app => ({
                    title: app.title,
                    callback: pipefy => {
                        pipefy.closeDropdown()
                        return showAppModal(app.name, pipefy)
                    }
                }))
                & when(~(query && query.length > 0), filter(where({
                    title: toLower & contains(toLower(query))
                })))
            )
    }))

/**
 * Displays the dropdown to search categories. When the user finally picks a
 * category, display related apps.
 *
 * @param {Pipefy} pipefy
 * @return {Promise}
 */
const showCategorySearch = pipefy =>
    pipefy.search({
        title: 'Select category',
        placeholder: 'Search categories',
        loading: 'Loading categories',
        empty: 'No category found',
        items: (client, query) => fetch(`https://app.rung.com.br/api/categories?lang=${convertLocale(pipefy.locale)}`)
            .then(_.json())
            .then(
                map(({ alias, name }) => ({
                    title: name,
                    callback: showAppSearch(alias)
                }))
                & when(~(query && query.length > 0), filter(where({
                    title: toLower & contains(toLower(query))
                })))
            )
    })

PipefyApp.initCall({
    'card-tab': (pipefy, pipe) => ({
        icon: './resources/rung.png',
        title: 'Rung',
        url: './attachments.html',
        claimedAttachments: filter(startsWith('https://app.rung.com.br/')),
        buttons: [
            {
                text: 'Attach',
                callback: pipefy => getToken(pipefy)
                    .then(~showCategorySearch(pipefy))
            }
        ]
    })
})
