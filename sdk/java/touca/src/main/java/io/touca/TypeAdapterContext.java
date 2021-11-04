package io.touca;

import java.util.ArrayList;
import java.util.Iterator;
import java.util.List;
import java.util.AbstractMap.SimpleEntry;

/**
 * Utility class to help consumers convert types to custom objects.
 *
 * @see TypeAdapter
 */
public final class TypeAdapterContext {
  /** list of data points within a given object */
  private final List<SimpleEntry<String, Object>> members = new ArrayList<>();

  /**
   * Adds a data point of arbitrary type as an object member.
   *
   * @param name name of the variable passed as `member`.
   * @param member variable to be tracked as a member of this object.
   */
  public void add(final String name, final Object member) {
    members.add(new SimpleEntry<>(name, member));
  }

  /**
   * Used during serialization of this object.
   *
   * @return iterator to members of this object.
   */
  public Iterator<SimpleEntry<String, Object>> iterator() {
    return members.iterator();
  }
}
