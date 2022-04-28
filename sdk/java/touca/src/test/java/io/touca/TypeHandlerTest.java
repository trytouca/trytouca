// Copyright 2021 Touca, Inc. Subject to Apache-2.0 License.

package io.touca;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import java.lang.RuntimeException;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import io.touca.core.IntegerType;
import io.touca.core.ToucaType;
import io.touca.core.TypeHandler;
import org.junit.jupiter.api.Test;

public class TypeHandlerTest {
  public static final class Foo {
    public boolean a = true;
    public int b = 42;
  }
  public static final class Bar {
    @SuppressWarnings("unused")
    private int c = 42;
  }
  public static final class Baz {
    public Foo d = new Foo();

    @SuppressWarnings("unused")
    private Bar e = new Bar();
  }


  @Test
  public void checkPrimitiveLong() {
    TypeHandler handler = new TypeHandler();
    ToucaType transformed = handler.transform(12L);
    assertEquals(ToucaType.Types.Number, transformed.type());
    assertEquals("12", transformed.json().getAsString());
  }

  @Test
  public void checkPrimitiveString() {
    TypeHandler handler = new TypeHandler();
    ToucaType transformed = handler.transform("some-string");
    assertEquals(ToucaType.Types.String, transformed.type());
    assertEquals("some-string", transformed.json().getAsString());
  }

  @Test
  public void checkSimpleFloatArray() {
    float[] floats = new float[] {12.0f, 42.0f};
    TypeHandler handler = new TypeHandler();
    ToucaType transformed = handler.transform(floats);
    assertEquals(ToucaType.Types.Array, transformed.type());
    assertEquals("[12.0,42.0]", transformed.json().toString());
  }

  @Test
  public void checkSimpleDoubleList() {
    List<Double> doubles = new ArrayList<>(Arrays.asList(12.0, 42.0));
    TypeHandler handler = new TypeHandler();
    ToucaType transformed = handler.transform(doubles);
    assertEquals(ToucaType.Types.Array, transformed.type());
    assertEquals("[12.0,42.0]", transformed.json().toString());
  }

  @Test
  public void checkSimpleObject() {
    TypeHandler handler = new TypeHandler();
    ToucaType transformed = handler.transform(new Foo());
    assertEquals(ToucaType.Types.Object, transformed.type());
    assertEquals("{\"a\":true,\"b\":42}", transformed.json().toString());
  }

  @Test
  public void checkToucaType() {
    TypeHandler handler = new TypeHandler();
    ToucaType transformed = handler.transform(new IntegerType(12));
    assertEquals(ToucaType.Types.Number, transformed.type());
    assertEquals("12", transformed.json().toString());
  }

  @Test
  public void checkSimpleAdapter() {
    TypeHandler handler = new TypeHandler();
    handler.disableReflection();
    handler.addTypeAdapter(Foo.class, (foo) -> foo.a);
    ToucaType transformed = handler.transform(new Foo());
    assertEquals(ToucaType.Types.Boolean, transformed.type());
    assertEquals("true", transformed.json().toString());
  }

  @Test
  public void checkSimpleAdapterWithoutReflection() {
    TypeHandler handler = new TypeHandler();
    handler.disableReflection();
    RuntimeException thrown = assertThrows(RuntimeException.class, () -> {
      handler.transform(new Foo());
    });
    assertTrue(
        thrown.getMessage().contains("No serializer is registered for type"));
    assertTrue(thrown.getMessage().contains("io.touca.TypeHandlerTest$Foo"));
  }

  @Test
  public void checkContextAdapter() {
    TypeHandler handler = new TypeHandler();
    handler.addTypeAdapter(Foo.class, (foo) -> {
      TypeAdapterContext object = new TypeAdapterContext();
      object.add("a", foo.a);
      return object;
    });
    ToucaType transformed = handler.transform(new Foo());
    assertEquals(ToucaType.Types.Object, transformed.type());
    assertEquals("{\"a\":true}", transformed.json().toString());
  }

  @Test
  public void checkPrivateObject() {
    TypeHandler handler = new TypeHandler();
    ToucaType transformed = handler.transform(new Bar());
    assertEquals(ToucaType.Types.Object, transformed.type());
    assertEquals("{}", transformed.json().toString());
  }

  @Test
  public void checkNestedObject() {
    TypeHandler handler = new TypeHandler();
    ToucaType transformed = handler.transform(new Baz());
    assertEquals(ToucaType.Types.Object, transformed.type());
    assertEquals("{\"d\":{\"a\":true,\"b\":42}}",
        transformed.json().toString());
  }

}
