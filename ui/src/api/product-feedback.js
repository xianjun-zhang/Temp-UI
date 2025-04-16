import client from './client'

const createFeedback = (data) => client.post('/product-feedback', data)

const uploadAttachmentFile = (formData, config = {}) =>
    client.post(`/product-feedback/upload`, formData, config)


// // Get all feedback (admin only)
// const getAllFeedback = (params = {}) => client.get('/feedback', { params })

// // Get feedback by ID (admin only)
// const getFeedbackById = (id) => client.get(`/feedback/${id}`)

// // Update feedback status (admin only)
// const updateFeedbackStatus = (id, data) => client.patch(`/feedback/${id}/status`, data)

// // Delete feedback (admin only)
// const deleteFeedback = (id) => client.delete(`/feedback/${id}`)

export default {
    createFeedback,
    uploadAttachmentFile
}