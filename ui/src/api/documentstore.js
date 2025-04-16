import client from './client'

const getAllDocumentStores = () => client.get('/document-store/stores')
const getDocumentLoaders = () => client.get('/document-store/loaders')

const getSpecificDocumentStore = (id) => client.get(`/document-store/store/${id}`)
const getSpecificDocumentLoader = (id) => client.get(`/document-store/loader/${id}`)
const createDocumentStore = (body) => client.post(`/document-store/store`, body)
const updateDocumentStore = (id, body) => client.put(`/document-store/store/${id}`, body)
const deleteDocumentStore = (id) => client.delete(`/document-store/store/${id}`)

const deleteLoaderFromStore = (id, fileId, isDeleteFile = false) => 
    client.delete(`/document-store/loader/${id}/${fileId}?hardDelete=${isDeleteFile}`)
const deleteChunkFromStore = (storeId, fileId, chunkId) => client.delete(`/document-store/chunks/${storeId}/${fileId}/${chunkId}`)
const editChunkFromStore = (storeId, fileId, chunkId, body) =>
    client.put(`/document-store/chunks/${storeId}/${fileId}/${chunkId}`, body)

const getFileChunks = (storeId, fileId, pageNo) => client.get(`/document-store/chunks/${storeId}/${fileId}/${pageNo}`)
const previewChunks = (body) => client.post('/document-store/loader/preview', body)
const processChunks = (body) => client.post(`/document-store/loader/process`, body)

//  the uploadFile function
const uploadFileToStore = (storeId, formData, config = {}) =>
    client.post(`/document-store/store/${storeId}/file/upload`, formData, config)

export default {
    getAllDocumentStores,
    getSpecificDocumentStore,
    getSpecificDocumentLoader,
    createDocumentStore,
    deleteLoaderFromStore,
    getFileChunks,
    updateDocumentStore,
    previewChunks,
    processChunks,
    getDocumentLoaders,
    deleteChunkFromStore,
    editChunkFromStore,
    deleteDocumentStore,
    uploadFileToStore,
}
