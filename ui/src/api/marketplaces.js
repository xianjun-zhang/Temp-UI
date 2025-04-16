import client from './client'

const getUserTemplates = () => client.get('/marketplaces/templates/user')
const getTemplateByChatflowId = (chatflowId) => client.get(`/marketplaces/templates/chatflow/${chatflowId}`)

const publishTemplate = (body) => client.post('/marketplaces/templates/publish', body)
const createTemplate = (body) => client.post('/marketplaces/templates/create', body)
const updateTemplate = (body) => client.put(`/marketplaces/templates/update/`, body)
const deleteTemplate = (id) => client.delete(`/marketplaces/templates/delete/${id}`)


// const getAllToolsMarketplaces = () => client.get('/marketplaces/tools')
const getAllTemplatesFromMarketplaces = () => client.get('/marketplaces/templates')
const getTemplateById = (id) => client.get(`/marketplaces/templates/${id}`)

export default {
    // getAllToolsMarketplaces,
    getAllTemplatesFromMarketplaces,
    getTemplateById,
    getUserTemplates,
    getTemplateByChatflowId,
    createTemplate,
    updateTemplate,
    deleteTemplate,
    publishTemplate
}
