import client from './client'

const getAllNodes = () => client.get('/nodes')

const getSpecificNode = (name) => client.get(`/nodes/${name}`)
const getNodesByCategory = (name) => client.get(`/nodes/category/${name}`)

const executeCustomFunctionNode = (body) => client.post(`/node-custom-function`, body)

/**
 * Get compatible nodes for a specific node's anchor
 * @param {string} nodeId - The ID of the node
 * @param {string} anchorName - The name of the anchor
 * @param {boolean} isOption - Whether the anchor is an option in an output anchor with type "options"
 * @returns {Promise} - Promise that resolves to the compatible nodes data
 */
const getCompatibleNodes = (nodeId, anchorName, isOption = false) => {
    const queryParams = isOption ? `?isOption=true` : ''
    return client.get(`/nodes/compatible/${nodeId}/${anchorName}${queryParams}`)
}

export default {
    getAllNodes,
    getSpecificNode,
    executeCustomFunctionNode,
    getNodesByCategory,
    getCompatibleNodes
}
