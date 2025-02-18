package org.todolist.dao;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Statement;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.logging.Logger;

import org.todolist.model.Todo;
import org.todolist.utils.DatabaseConfig;

public class TodoDAO {
  private static final Logger logger = Logger.getLogger(TodoDAO.class.getName());

  public TodoDAO() throws SQLException {
    createTableIfNotExists();
  }

  public Connection getConnection() throws SQLException {
    return DatabaseConfig.getConnection();
  }

  private void createTableIfNotExists() throws SQLException {
    String sql = "CREATE TABLE IF NOT EXISTS todos (" +
        "id VARCHAR(36) PRIMARY KEY, " +
        "title VARCHAR(255) NOT NULL, " +
        "description TEXT, " +
        "completed BOOLEAN DEFAULT FALSE, " +
        "position INT NOT NULL)";
    try (Connection conn = getConnection();
        Statement stmt = conn.createStatement()) {
      stmt.executeUpdate(sql);
    }
  }

  public List<Todo> getAllTodos() throws SQLException {
    List<Todo> todos = new ArrayList<>();
    String sql = "SELECT * FROM todos ORDER BY position";
    try (Connection conn = getConnection();
        PreparedStatement pstmt = conn.prepareStatement(sql);
        ResultSet rs = pstmt.executeQuery()) {
      while (rs.next()) {
        todos.add(mapResultSetToTodo(rs));
      }
    }
    return todos;
  }

  public Todo getTodoById(String id) throws SQLException {
    String sql = "SELECT * FROM todos WHERE id = ?";
    try (Connection conn = getConnection();
        PreparedStatement pstmt = conn.prepareStatement(sql)) {
      pstmt.setString(1, id);
      try (ResultSet rs = pstmt.executeQuery()) {
        return rs.next() ? mapResultSetToTodo(rs) : null;
      }
    }
  }

  public Todo addTodo(Todo todo) throws SQLException {
    String sql = "INSERT INTO todos (id, title, description, completed, position) VALUES (?, ?, ?, ?, ?)";
    try (Connection conn = getConnection();
        PreparedStatement pstmt = conn.prepareStatement(sql)) {
      todo.setId(UUID.randomUUID().toString());
      todo.setPosition(getMaxPosition() + 1);
      pstmt.setString(1, todo.getId());
      pstmt.setString(2, todo.getTitle());
      pstmt.setString(3, todo.getDescription());
      pstmt.setBoolean(4, todo.isCompleted());
      pstmt.setInt(5, todo.getPosition());
      pstmt.executeUpdate();
      return todo;
    }
  }

  private int getMaxPosition() throws SQLException {
    String sql = "SELECT COALESCE(MAX(position), 0) FROM todos";
    try (Connection conn = getConnection();
        PreparedStatement pstmt = conn.prepareStatement(sql);
        ResultSet rs = pstmt.executeQuery()) {
      return rs.next() ? rs.getInt(1) : 0;
    }
  }

  public boolean updateTodo(Todo todo) throws SQLException {
    String sql = "UPDATE todos SET title = ?, description = ?, completed = ?, position = ? WHERE id = ?";
    try (Connection conn = getConnection();
        PreparedStatement pstmt = conn.prepareStatement(sql)) {
      pstmt.setString(1, todo.getTitle());
      pstmt.setString(2, todo.getDescription());
      pstmt.setBoolean(3, todo.isCompleted());
      pstmt.setInt(4, todo.getPosition());
      pstmt.setString(5, todo.getId());
      return pstmt.executeUpdate() > 0;
    }
  }

  public boolean deleteTodo(String id) throws SQLException {
    String sql = "DELETE FROM todos WHERE id = ?";
    try (Connection conn = getConnection();
        PreparedStatement pstmt = conn.prepareStatement(sql)) {
      pstmt.setString(1, id);
      return pstmt.executeUpdate() > 0;
    }
  }

  private Todo mapResultSetToTodo(ResultSet rs) throws SQLException {
    return new Todo(
        rs.getString("id"),
        rs.getString("title"),
        rs.getString("description"),
        rs.getBoolean("completed"),
        rs.getInt("position"));
  }

  public boolean reorderTodo(String id, int newPosition) throws SQLException {
    logger.info("reorderTodo - START - id: " + id + ", newPosition: " + newPosition);

    logger.info("reorderTodo - Todos BEFORE reorder operation (database state): " + getAllTodosInternal());

    String sqlGetTotalCount = "SELECT COUNT(*) as total FROM todos";
    String sqlGetCurrentPosition = "SELECT position FROM todos WHERE id = ?";
    String sqlUpdatePosition = "UPDATE todos SET position = ? WHERE id = ?";
    String sqlShiftDown = "UPDATE todos SET position = position - 1 WHERE position > ? AND position <= ?";
    String sqlShiftUp = "UPDATE todos SET position = position + 1 WHERE position >= ? AND position < ?";

    Connection conn = null;
    try {
      conn = getConnection();
      conn.setAutoCommit(false);

      int totalCount;
      try (PreparedStatement pstmt = conn.prepareStatement(sqlGetTotalCount)) {
        ResultSet rs = pstmt.executeQuery();
        if (!rs.next()) {
          return false;
        }
        totalCount = rs.getInt("total");
      }
      logger.info("reorderTodo - totalCount: " + totalCount);

      if (newPosition < 0 || newPosition >= totalCount) {
        logger.warning("reorderTodo - Invalid newPosition: " + newPosition + ", totalCount: " + totalCount);
        return false;
      }

      int currentPosition;
      try (PreparedStatement pstmt = conn.prepareStatement(sqlGetCurrentPosition)) {
        pstmt.setString(1, id);
        ResultSet rs = pstmt.executeQuery();
        if (!rs.next()) {
          return false;
        }
        currentPosition = rs.getInt("position");
      }
      logger.info("reorderTodo - currentPosition: " + currentPosition);

      if (currentPosition == newPosition) {
        logger.info("reorderTodo - No position change needed, currentPosition == newPosition");
        conn.commit();
        return true;
      }

      if (newPosition > currentPosition) {
        logger.info(
            "reorderTodo - Shifting Down - currentPosition: " + currentPosition + ", newPosition: " + newPosition);
        try (PreparedStatement pstmt = conn.prepareStatement(sqlShiftDown)) {
          pstmt.setInt(1, currentPosition);
          pstmt.setInt(2, newPosition);
          logger.info(
              "reorderTodo - SQL Shift Down: " + sqlShiftDown + " params: " + currentPosition + ", " + newPosition);
          pstmt.executeUpdate();
          logger.info("reorderTodo - Shift Down - Rows Updated: " + pstmt.getUpdateCount());
        }
      } else {
        logger
            .info("reorderTodo - Shifting Up - currentPosition: " + currentPosition + ", newPosition: " + newPosition);
        try (PreparedStatement pstmt = conn.prepareStatement(sqlShiftUp)) {
          pstmt.setInt(1, newPosition);
          pstmt.setInt(2, currentPosition);
          logger.info("reorderTodo - SQL Shift Up: " + sqlShiftUp + " params: " + newPosition + ", " + currentPosition);
          pstmt.executeUpdate();
          logger.info("reorderTodo - Shift Up - Rows Updated: " + pstmt.getUpdateCount());
        }
      }

      try (PreparedStatement pstmt = conn.prepareStatement(sqlUpdatePosition)) {
        pstmt.setInt(1, newPosition);
        pstmt.setString(2, id);
        logger.info("reorderTodo - SQL Update Position: " + sqlUpdatePosition + " params: " + newPosition + ", " + id);
        int updatedRows = pstmt.executeUpdate();
        logger.info("reorderTodo - Updated Rows for position: " + updatedRows);
        if (updatedRows == 0) {
          throw new SQLException("Todo not found with id: " + id);
        }
      }

      conn.commit();

      logger.info("reorderTodo - Todos AFTER reorder operation and commit (database state): " + getAllTodosInternal());
      logger.info("reorderTodo - END - Reorder successful for id: " + id + ", newPosition: " + newPosition);
      return true;

    } catch (SQLException e) {
      logger.severe("reorderTodo - SQLException: " + e.getMessage());
      if (conn != null) {
        try {
          conn.rollback();
        } catch (SQLException rollbackEx) {
          logger.severe("reorderTodo - Rollback Exception: " + rollbackEx.getMessage());
          rollbackEx.printStackTrace();
        }
      }
      throw e;
    } finally {
      if (conn != null) {
        try {
          conn.setAutoCommit(true);
          conn.close();
        } catch (SQLException closeEx) {
          logger.severe("reorderTodo - Close Connection Exception: " + closeEx.getMessage());
          closeEx.printStackTrace();
        }
      }
    }
  }

  private List<Todo> getAllTodosInternal() throws SQLException {
    List<Todo> todos = new ArrayList<>();
    String sql = "SELECT * FROM todos ORDER BY position ASC";
    try (Connection conn = getConnection();
        Statement stmt = conn.createStatement();
        ResultSet rs = stmt.executeQuery(sql)) {
      while (rs.next()) {
        todos.add(createTodoFromResultSet(rs));
      }
    }
    return todos;
  }

  private Todo createTodoFromResultSet(ResultSet rs) throws SQLException {
    Todo todo = new Todo();
    todo.setId(rs.getString("id"));
    todo.setTitle(rs.getString("title"));
    todo.setDescription(rs.getString("description"));
    todo.setCompleted(rs.getBoolean("completed"));
    todo.setPosition(rs.getInt("position"));
    return todo;
  }
}
