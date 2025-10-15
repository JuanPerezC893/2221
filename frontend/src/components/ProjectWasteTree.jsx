import React, { useMemo, useState } from 'react';
import { deleteProyecto } from '../api/proyectos';
import ConfirmationModal from './ConfirmationModal';
import './ProjectWasteTree.css';

const ProjectWasteTree = ({ projects, wastes, onFinishProject, onOpenLabelModal, onOpenEditWasteModal, onOpenDeleteWasteModal, onDataChange, finalizingProjectId, userRole, className, isTreeEditing, setIsTreeEditing, onMarcarEnCamino }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState(null);

  const projectTree = useMemo(() => {
    const sortedProjects = [...projects].sort((a, b) => b.id_proyecto - a.id_proyecto);
    const projectMap = new Map(sortedProjects.map(p => [p.id_proyecto, { ...p, wastes: [] }]));

    const sortedWastes = [...wastes].sort((a, b) => b.id_residuo - a.id_residuo);
    sortedWastes.forEach(waste => {
      if (projectMap.has(waste.id_proyecto)) {
        projectMap.get(waste.id_proyecto).wastes.push(waste);
      }
    });

    return Array.from(projectMap.values());
  }, [projects, wastes]);

  const handleOpenDeleteModal = (projectId) => {
    setProjectToDelete(projectId);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setProjectToDelete(null);
  };

  const handleConfirmDelete = async () => {
    if (projectToDelete) {
      try {
        await deleteProyecto(projectToDelete);
        if (onDataChange) {
          onDataChange();
        }
      } catch (error) {
        console.error('Error deleting project:', error);
        alert('Error al eliminar el proyecto. Verifique la consola para más detalles.');
      } finally {
        handleCloseModal();
      }
    }
  };

  const getStatusBadge = (status) => {
    if (!status) {
        return <span className="badge bg-dark">Desconocido</span>;
    }
    const lowerCaseStatus = status.trim().toLowerCase();
    const statusStyles = {
      pendiente: 'bg-dark',
      'en camino': 'bg-primary',
      entregado: 'bg-success',
    };
    const displayStatus = lowerCaseStatus.charAt(0).toUpperCase() + lowerCaseStatus.slice(1);
    const badgeClass = statusStyles[lowerCaseStatus] || 'bg-dark';

    return <span className={`badge ${badgeClass}`}>{displayStatus}</span>;
  };

  return (
    <>
      <div className={`card ${className || ''}`}>
        <div className="card-header bg-primary text-white d-flex justify-content-between align-items-center">
          <h3 className="h5 mb-0">Proyectos y Residuos</h3>
          <button className="btn btn-light btn-sm" onClick={() => setIsTreeEditing(!isTreeEditing)}>
            {isTreeEditing ? 'Cancelar' : 'Editar'}
          </button>
        </div>
        <div className="card-body project-waste-tree-body">
          {projectTree.length > 0 ? (
            <div className="list-group list-group-flush">
              {projectTree.map(project => {
                const isFinalizing = finalizingProjectId === project.id_proyecto;
                return (
                  <div key={project.id_proyecto} className="card mb-3">
                    <div className="card-header d-flex justify-content-between align-items-center project-card-header">
                      <strong>{project.nombre}</strong>
                      <div style={{ visibility: isTreeEditing ? 'visible' : 'hidden' }}>
                        {userRole === 'admin' && (
                          <button className="btn btn-danger btn-sm me-2" onClick={() => handleOpenDeleteModal(project.id_proyecto)}>Eliminar</button>
                        )}
                        <button 
                          className="btn btn-success btn-sm" 
                          onClick={() => onFinishProject(project.id_proyecto)}
                          disabled={isFinalizing}
                        >
                          {isFinalizing ? (
                            <>
                              <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                              <span className="ms-1">Generando...</span>
                            </>
                          ) : (
                            'Finalizar'
                          )}
                        </button>
                      </div>
                    </div>
                    <div className="card-body">
                      {project.wastes.length > 0 ? (
                        <ul className="list-group ms-4 waste-list-scrollable">
                          {project.wastes.map(waste => (
                            <li key={waste.id_residuo} className="list-group-item d-flex justify-content-between align-items-center ps-4 waste-list-item">
                              <span>
                                {waste.tipo} <br />
                                <small className="text-muted">{waste.nombre_creador || 'N/A'}</small>
                              </span>
                              {getStatusBadge(waste.estado)}
                              <div>
                                {isTreeEditing && waste.estado?.trim().toLowerCase() === 'pendiente' && (
                                  <>
                                    <button className="btn btn-danger btn-sm me-2" onClick={() => onOpenDeleteWasteModal(waste)}>Eliminar</button>
                                    <button className="btn btn-warning btn-sm me-2" onClick={() => onOpenEditWasteModal(waste)}>Editar</button>
                                    <button onClick={() => onMarcarEnCamino(waste)} className="btn btn-info btn-sm me-2" title="Marcar como En Camino">Enviar</button>
                                  </>
                                )}
                                <button className="btn btn-secondary btn-sm" onClick={() => onOpenLabelModal(waste)}>Ver / Imprimir</button>
                              </div>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-muted ps-3">No hay residuos para este proyecto.</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-muted">No hay proyectos para mostrar.</p>
          )}
        </div>
      </div>

      {userRole === 'admin' && (
        <ConfirmationModal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          onConfirm={handleConfirmDelete}
          title="Confirmar Eliminación"
        >
          ¿Está seguro de que desea eliminar este proyecto? Todos los datos asociados se perderán de forma definitiva. Esta acción no se puede revertir.
        </ConfirmationModal>
      )}
    </>
  );
};

export default ProjectWasteTree;
