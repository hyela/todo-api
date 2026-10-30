import { useAuth } from "react-oidc-context";

import { useEffect, useState } from "react";

const Home = () => {

    const auth = useAuth();

    const [tasks, setTasks] = useState<any[]>([]);

    const [loadingTasks, setLoadingTasks] = useState(false);
    const [errorTasks, setErrorTasks] = useState("");
    const [selectedTask, setSelectedTask] = useState(null);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [taskToDelete, setTaskToDelete] = useState(null);

    const [newTask, setNewTask] = useState({
        title: "",
        description: "",
        completed: false
    });

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;

        setNewTask({
            ...newTask,
            [name]: type === "checkbox" ? checked : value
        });
    };

    const handleCreateTask = async (e) => {
        e.preventDefault();

        try {

            const response = await fetch(
                "http://localhost:8081/services/tasks",
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${auth.user?.access_token}`
                    },
                    body: JSON.stringify(newTask)
                }
            );

            if (!response.ok) {
                throw new Error(`Error HTTP: ${response.status}`);
            }

            const data = await response.json();

            console.log("Tarea creada:", data);

            // Cerrar modal
            setShowCreateModal(false);

            // Limpiar formulario
            setNewTask({
                title: "",
                description: "",
                completed: false
            });

            // Volver a cargar las tareas
            // Aquí debemos llamar a tu función que obtiene las tareas

        } catch (error) {
            console.error("Error creando tarea:", error);
        }
    };

const handleDeleteTask = async (id) => {
    try {
        const response = await fetch(
            `http://localhost:8081/services/tasks/${id}`,
            {
                method: "DELETE",
                headers: {
                    "Authorization": `Bearer ${auth.user?.access_token}`
                }
            }
        );

        if (!response.ok) {
            throw new Error(`Error HTTP: ${response.status}`);
        }

        console.log("Tarea eliminada:", id);

        // Eliminar de la tabla
        setTasks(prevTasks =>
            prevTasks.filter(task => task.id !== id)
        );

        // Cerrar modal
        setTaskToDelete(null);

    } catch (error) {
        console.error("Error eliminando tarea:", error);
    }
};


    const handleViewDetail = async (id) => {
        try {
            const response = await fetch(
                `http://localhost:8081/services/tasks/${id}`, {
                    headers: {
                    'Authorization': `Bearer ${auth.user?.access_token}`
                    }
                }
            );

            if (!response.ok) {
                throw new Error("No se pudo obtener el detalle de la tarea");
            }

            const data = await response.json();

            setSelectedTask(data);
        } catch (error) {
            console.error("Error:", error);
        }
    };

    /*
const fetchTasks = async () => {
  const response = await fetch('http://localhost:8081/services/tasks', {
    headers: {
      'Authorization': `Bearer ${auth.user?.access_token}`
    }
  });

  const data = await response.json();
  setTasks(data);
  console.log(data);
};
*/

    useEffect(() => {
        if (auth.isAuthenticated && auth.user?.access_token) {
            setLoadingTasks(true);
            setErrorTasks("");

            fetch("http://localhost:8081/services/tasks", {
                method: "GET",
                headers: {
                    // Inyectamos el token JWT para pasar las anotaciones @RolesAllowed
                    "Authorization": `Bearer ${auth.user.access_token}`,
                    "Content-Type": "application/json"
                }
            })
            .then(response => {
                if (!response.ok) {
                    throw new Error(`Error ${response.status}: No autorizado o bloqueado por país`);
                }
                return response.json();
            })
            .then(data => {
                setTasks(data);
                setLoadingTasks(false);
            })
            .catch(err => {
                setErrorTasks(err.message);
                setLoadingTasks(false);
            });
        }
    }, [auth.isAuthenticated, auth.user]);

    if (auth.isLoading) {
        return <div>Cargando estado de autenticación...</div>;
    }

    if (auth.error) {
        return <div>¡Ups! Ocurrió un error de autenticación: {auth.error.message}</div>;
    }

    if (auth.isAuthenticated) {
        return (
            <div>
                <h1>Bienvenido, {auth.user?.profile.preferred_username}!</h1>
                
                <hr />

                {loadingTasks && <p>Cargando tareas desde el servidor...</p>}
                
                {errorTasks && (
                    <p style={{ color: "red" }}>
                        <strong>Error al cargar tareas:</strong> {errorTasks}
                    </p>
                )}

                {!loadingTasks && !errorTasks && tasks.length === 0 && (
                    <p>No tienes tareas registradas actualmente.</p>
                )}

            <div className="tasks-toolbar">
                <h3>Mis Tareas</h3>

                <button
                    className="create-button"
                    onClick={() => setShowCreateModal(true)}
                >
                    + Crear tarea
                </button>
            </div>


            <div className="tasks-container">
                <div className="task-row task-header">
                    <div>Título</div>
                    <div>Descripción</div>
                    <div>Estado</div>
                    <div>Acciones</div>
                </div>

                {tasks.map(task => (
                    <div className="task-row" key={task.id}>
                        <div>
                            <strong>{task.title}</strong>
                        </div>

                        <div>
                            {task.description}
                        </div>

                        <div>
                            {task.completed
                                ? "✅ Completada"
                                : "⏳ Pendiente"}
                        </div>

                        <div>
                            <button
                                className="detail-button"
                                onClick={() => handleViewDetail(task.id)}
                                title="Ver detalle"
                            >
                                📋
                            </button>
                            <button
                                className="delete-button"
                                onClick={() => setTaskToDelete(task)}
                                title="Eliminar tarea"
                            >
                                🗑️
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {selectedTask && (
                <div className="modal-overlay">
                    <div className="modal">

                        <div className="modal-header">
                            <h2>Detalle de la tarea</h2>

                            <button
                                className="modal-close"
                                onClick={() => setSelectedTask(null)}
                            >
                                ✕
                            </button>
                        </div>

                        <div className="modal-body">

                            <p>
                                <strong>ID:</strong>
                                <br />
                                {selectedTask.id}
                            </p>

                            <p>
                                <strong>Título:</strong>
                                <br />
                                {selectedTask.title}
                            </p>

                            <p>
                                <strong>Descripción:</strong>
                                <br />
                                {selectedTask.description}
                            </p>

                            <p>
                                <strong>Estado:</strong>
                                <br />
                                {selectedTask.completed
                                    ? "✅ Completada"
                                    : "⏳ Pendiente"}
                            </p>

                        </div>

                        <div className="modal-footer">
                            <button
                                className="close-button"
                                onClick={() => setSelectedTask(null)}
                            >
                                Cerrar
                            </button>
                        </div>

                    </div>
                </div>
            )}

{showCreateModal && (
    <div className="modal-overlay">
        <div className="modal">

            <div className="modal-header">
                <h2>Crear tarea</h2>

                <button
                    className="modal-close"
                    onClick={() => setShowCreateModal(false)}
                >
                    ✕
                </button>
            </div>

            <form onSubmit={handleCreateTask}>

                <div className="modal-body">

                    <div className="form-group">
                        <label>Título</label>

                        <input
                            type="text"
                            name="title"
                            value={newTask.title}
                            onChange={handleInputChange}
                            placeholder="Ingrese el título"
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label>Descripción</label>

                        <textarea
                            name="description"
                            value={newTask.description}
                            onChange={handleInputChange}
                            placeholder="Ingrese la descripción"
                            required
                        />
                    </div>

                    <div className="form-checkbox">
                        <input
                            type="checkbox"
                            name="completed"
                            checked={newTask.completed}
                            onChange={handleInputChange}
                        />

                        <label>Completada</label>
                    </div>

                </div>

                <div className="modal-footer">

                    <button
                        type="button"
                        className="close-button"
                        onClick={() => setShowCreateModal(false)}
                    >
                        Cancelar
                    </button>

                    <button
                        type="submit"
                        className="create-button"
                    >
                        Crear tarea
                    </button>

                </div>

            </form>

        </div>
    </div>
)}


{taskToDelete && (
    <div className="modal-overlay">
        <div className="modal delete-modal">

            <div className="modal-header">
                <h2>Eliminar tarea</h2>

                <button
                    className="modal-close"
                    onClick={() => setTaskToDelete(null)}
                >
                    ✕
                </button>
            </div>

            <div className="modal-body">

                <div className="delete-icon">
                    ⚠️
                </div>

                <p>
                    ¿Está seguro de que desea eliminar esta tarea?
                </p>

                <p>
                    <strong>{taskToDelete.title}</strong>
                </p>

                <p className="delete-warning">
                    Esta acción no se puede deshacer.
                </p>

            </div>

            <div className="modal-footer">

                <button
                    type="button"
                    className="close-button"
                    onClick={() => setTaskToDelete(null)}
                >
                    Cancelar
                </button>

                <button
                    type="button"
                    className="delete-confirm-button"
                    onClick={() => handleDeleteTask(taskToDelete.id)}
                >
                    🗑️ Eliminar
                </button>

            </div>

        </div>
    </div>
)}


                <button 
                    className="close-button" 
                    onClick={() => auth.signoutRedirect()}
                >
                    Cerrar Sesión (Logout)
                </button>
            </div>
        );
    }


    return (
        <div>
            <h1>Home</h1>
            <p>Por favor, inicia sesión para gestionar tus tareas.</p>
            <button className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition" onClick={() => auth.signinRedirect()}>
                Login
            </button>
        </div>
    )
}

export default Home;