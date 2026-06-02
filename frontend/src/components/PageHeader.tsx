interface PageHeaderProps {
  title?: string;
}

export default function PageHeader({ title }: PageHeaderProps) {
  return (
    <div className="page-header">
      <div className="page-header-logo">
        <img src="/images/MDL Rebranded (3).png" alt="MDL Logo" className="page-logo-img" />
        <span className="page-logo-text">CORTEX LAB</span>
      </div>
      {title && <h1 className="page-header-title">{title}</h1>}
    </div>
  );
}
