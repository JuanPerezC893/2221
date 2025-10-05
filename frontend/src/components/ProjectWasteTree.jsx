import React, { useMemo } from 'react';
import './ProjectWasteTree.css';

const ProjectWasteTree = ({ projects, wastes, onFinishProject, onOpenLabelModal }) => {
  const projectTree = useMemo(() => {
    const projectMap = new Map(projects.map(p => [p.id_proyecto, { ...p, wastes: [] }]));

    wastes.forEach(waste => {
      if (projectMap.has(waste.id_proyecto)) {
        projectMap.get(waste.id_proyecto).wastes.push(waste);
      }
    });

    return Array.from(projectMap.values());
  }, [projects, wastes]);

  return (
    <div className="card">
      <div className="card-header bg-primary text-white">
        <h3 className="h5 mb-0">Proyectos y Residuos</h3>
      </div>
      <div className="card-body project-waste-tree-body">
        {projectTree.length > 0 ? (
          <div className="list-group list-group-flush">
            {projectTree.map(project => (
              <div key={project.id_proyecto} className="card mb-3">
                <div className="card-header d-flex justify-content-between align-items-center">
                  <strong>{project.nombre}</strong>
                  <button className="btn btn-success btn-sm" onClick={() => onFinishProject(project.id_proyecto)}>Finalizar</button>
                </div>
                <div className="card-body">
                  {project.wastes.length > 0 ? (
                    <ul className="list-group ms-4">
                      {project.wastes.map(waste => (
                        <li key={waste.id_residuo} className="list-group-item d-flex justify-content-between align-items-center ps-4">
                          <span>
                            {waste.tipo} <br />
                            <small className="text-muted">{waste.nombre_creador || 'N/A'}</small>
                          </span>
                          <button className="btn btn-secondary btn-sm" onClick={() => onOpenLabelModal(waste)}>Ver / Imprimir</button>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-muted ps-3">No hay residuos para este proyecto.</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-muted">No hay proyectos para mostrar.</p>
        )}
      </div>
    </div>
  );
};

export default ProjectWasteTree;
