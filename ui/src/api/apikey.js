import client from './client'

const getAllAPIKeys = () => client.get('/apikeys')

const createNewAPI = (body) => client.post(`/apikeys`, body)

const updateAPI = (id, body) => client.put(`/apikeys/${id}`, body)

const deleteAPI = (id) => client.delete(`/apikeys/${id}`)

const importAPI = (body) => client.post(`/apikeys/import`, body)

export default {
    getAllAPIKeys,
    createNewAPI,
    updateAPI,
    deleteAPI,
    importAPI
}
