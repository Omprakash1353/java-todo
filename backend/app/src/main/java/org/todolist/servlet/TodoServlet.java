package org.todolist.servlet;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.PrintWriter;
import java.sql.SQLException;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.logging.Logger;

import javax.servlet.ServletException;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import org.todolist.dao.TodoDAO;
import org.todolist.model.Todo;

import com.google.gson.Gson;
import com.google.gson.JsonObject;
import com.google.gson.JsonSyntaxException;

public class TodoServlet extends HttpServlet {
  private static final Logger logger = Logger.getLogger(TodoServlet.class.getName());
  private final TodoDAO todoDAO;
  private final Gson gson = new Gson();

  public TodoServlet(TodoDAO todoDAO) {
    this.todoDAO = todoDAO;
  }

  @Override
  protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
    try {
      String id = getIdFromPath(req);
      if (id == null) {
        getAllTodos(resp);
      } else {
        getTodoById(resp, id);
      }
    } catch (IllegalArgumentException e) {
      sendErrorResponse(resp, 400, "Invalid request: " + e.getMessage());
    }
  }

  private void getAllTodos(HttpServletResponse resp) throws IOException {
    logger.info("Fetching all todos");
    try {
      List<Todo> todos = todoDAO.getAllTodos();
      sendJsonResponse(resp, 200, "Successfully fetched todos !!!", todos);
    } catch (SQLException e) {
      handleDatabaseError(resp, "GET /todos", e);
    }
  }

  private void getTodoById(HttpServletResponse resp, String id) throws IOException {
    logger.info("Fetching todo with ID: " + id);
    try {
      Todo todo = todoDAO.getTodoById(id);
      if (todo != null) {
        sendJsonResponse(resp, 200, "Successfully fetched todo !!!", todo);
      } else {
        sendErrorResponse(resp, 404, "Todo not found.");
      }
    } catch (SQLException e) {
      handleDatabaseError(resp, "GET /todos/" + id, e);
    }
  }

  @Override
  protected void doPost(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
    logger.info("Creating a new todo");
    try {
      Todo todo = getTodoFromRequest(req);
      if (todo.getTitle() == null || todo.getTitle().trim().isEmpty()) {
        sendErrorResponse(resp, 400, "Title field is required.");
        return;
      }

      Todo createdTodo = todoDAO.addTodo(todo);
      sendJsonResponse(resp, 201, "Successfully created todo !!!", createdTodo);
    } catch (JsonSyntaxException e) {
      sendErrorResponse(resp, 400, "Invalid JSON format.");
    } catch (SQLException e) {
      handleDatabaseError(resp, "POST /todos", e);
    }
  }

  @Override
  protected void doPut(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
    String path = req.getPathInfo();
    logger.info("Path: " + path);
    if (path != null && path.startsWith("/reorder/")) {
      logger.info("Reordering a todo");
      handleReorderRequest(req, resp);
    } else {
      handleUpdateRequest(req, resp);
    }
  }

  private void handleReorderRequest(HttpServletRequest req, HttpServletResponse resp) throws IOException {
    String id = req.getPathInfo().replace("/reorder/", "").trim();
    logger.info("Reordering a todo - ID to reorder: " + id);
    if (id.isEmpty()) {
      sendErrorResponse(resp, 400, "Invalid ID");
      return;
    }

    try (BufferedReader reader = req.getReader()) {
      JsonObject jsonRequest = gson.fromJson(reader, JsonObject.class);
      if (!jsonRequest.has("position")) {
        sendErrorResponse(resp, 400, "Missing 'position' field");
        return;
      }

      int newPosition = jsonRequest.get("position").getAsInt();
      logger.info("Reordering a todo - New position from request (received from frontend): " + newPosition);

      logger.info("handleReorderRequest - Before calling todoDAO.reorderTodo, current todos: " + todoDAO.getAllTodos());

      logger.info("Calling todoDAO.reorderTodo with id: " + id + ", newPosition: " + newPosition);
      boolean success = todoDAO.reorderTodo(id, newPosition);
      logger.info("todoDAO.reorderTodo success: " + success);

      if (success) {
        List<Todo> updatedTodos = todoDAO.getAllTodos();
        logger.info("handleReorderRequest - Todos AFTER reorder from todoDAO.getAllTodos(): " + updatedTodos);

        logger.info("handleReorderRequest - Sending JSON response with todos: " + updatedTodos);
        sendJsonResponse(resp, 200, "Todo reordered successfully", updatedTodos);
      } else {
        sendErrorResponse(resp, 404, "Todo not found");
      }
    } catch (JsonSyntaxException e) {
      sendErrorResponse(resp, 400, "Invalid JSON format");
    } catch (SQLException e) {
      handleDatabaseError(resp, "PUT /todos/reorder/" + id, e);
    }
  }

  private void handleUpdateRequest(HttpServletRequest req, HttpServletResponse resp) throws IOException {
    logger.info("Updating a todo");
    try {
      String id = getIdFromPath(req);
      Todo todo = getTodoFromRequest(req);
      todo.setId(id);

      if (todoDAO.updateTodo(todo)) {
        sendJsonResponse(resp, 200, "Successfully updated todo !!!", todo);
      } else {
        sendErrorResponse(resp, 404, "Todo not found.");
      }
    } catch (JsonSyntaxException e) {
      sendErrorResponse(resp, 400, "Invalid JSON format.");
    } catch (SQLException e) {
      handleDatabaseError(resp, "PUT /todos", e);
    }
  }

  @Override
  protected void doDelete(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
    logger.info("Deleting a todo");
    try {
      String id = getIdFromPath(req);
      if (todoDAO.deleteTodo(id)) {
        sendJsonResponse(resp, 204, "Successfully deleted todo !!!", null);
      } else {
        sendErrorResponse(resp, 404, "Todo not found.");
      }
    } catch (SQLException e) {
      handleDatabaseError(resp, "DELETE /todos", e);
    }
  }

  private Todo getTodoFromRequest(HttpServletRequest req) throws IOException {
    try (BufferedReader reader = req.getReader()) {
      return gson.fromJson(reader, Todo.class);
    }
  }

  private String getIdFromPath(HttpServletRequest req) {
    String pathInfo = req.getPathInfo();
    if (pathInfo == null || pathInfo.equals("/")) {
      return null;
    }
    if (pathInfo.matches("/reorder/[a-f0-9\\-]{36}")) {
      return pathInfo.substring(10);
    }
    if (pathInfo.matches("/[a-f0-9\\-]{36}")) {
      return pathInfo.substring(1);
    }
    throw new IllegalArgumentException("Invalid ID format.");
  }

  private void sendJsonResponse(HttpServletResponse resp, int status, String message, Object data) throws IOException {
    resp.setContentType("application/json");
    resp.setStatus(status);

    Map<String, Object> jsonResponse = new HashMap<>();
    jsonResponse.put("status", status);
    jsonResponse.put("message", message);
    jsonResponse.put("data", data);

    try (PrintWriter out = resp.getWriter()) {
      out.write(gson.toJson(jsonResponse));
    }
  }

  private void sendErrorResponse(HttpServletResponse resp, int status, String message) throws IOException {
    logger.warning("Error response: " + status + " - " + message);
    resp.setContentType("application/json");
    resp.setStatus(status);
    try (PrintWriter out = resp.getWriter()) {
      out.write(gson.toJson(new ErrorResponse(message)));
    }
  }

  private void handleDatabaseError(HttpServletResponse resp, String action, SQLException e) throws IOException {
    logger.severe("Database error in " + action + ": " + e.getMessage());
    sendErrorResponse(resp, 500, "Database error: " + e.getMessage());
  }

  private static class ErrorResponse {
    private final String message;

    public ErrorResponse(String message) {
      this.message = message;
    }

    @SuppressWarnings("unused")
    public String getMessage() {
      return message;
    }
  }

}