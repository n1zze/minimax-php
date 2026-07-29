export function calcProgress(sections) {
  if (!sections) return 0

  const checks = [
    // Timeline: at least 1 step completed
    sections.timeline?.steps?.some((s) => s.completed),
    // Contract PDF exists
    !!sections.contract?.pdfUrl,
    // Floor plan images exist
    sections.floorPlan?.images?.length > 0,
    // Floor plan approval
    !!sections.floorPlanApproval?.pdfUrl,
    // Collages
    sections.collages?.items?.length > 0,
    // Collages approval
    !!sections.collagesApproval?.pdfUrl,
    // Visualizations
    sections.visualizations?.tabs?.length > 0,
    // Drawings
    sections.drawings?.items?.length > 0,
    // Drawings approval
    !!sections.drawingsApproval?.pdfUrl,
    // Specification
    sections.specification?.items?.length > 0,
    // Specification approval
    !!sections.specificationApproval?.pdfUrl,
    // Final project
    sections.finalProject?.items?.length > 0,
    // Author supervision
    sections.authorSupervision?.diary?.length > 0,
  ]

  const completed = checks.filter(Boolean).length
  return Math.round((completed / checks.length) * 100)
}
