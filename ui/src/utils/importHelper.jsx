
export const getWorkflowDataFromJSON = (fileData, flowType = 'CHATFLOW') => {
    try {
        const flowData = JSON.parse(fileData)
        if (!flowData || !flowData.workflows || flowData.workflows.length === 0 || !flowData.workflows[0].flowData) {
            throw new Error('Invalid file format')
        }

        const importedFlowData = flowData.workflows[0]

        if (!importedFlowData.type || importedFlowData.type !== flowType) {
            throw new Error(`Invalid workflow type, you can only import ${flowType} workflows.`)
        }
        
        // Only import the first workflow if there are multiple in the file
        const workflowData = JSON.parse(importedFlowData.flowData)

        if (!workflowData.nodes || !workflowData.edges) {
            throw new Error('Invalid file format')
        }

        return JSON.stringify(workflowData)
    } catch (error) {
        throw error
    }
}