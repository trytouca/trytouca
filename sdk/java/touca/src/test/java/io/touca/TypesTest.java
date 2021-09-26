// Copyright 2021 Touca, Inc. Subject to Apache-2.0 License.

package io.touca;

import static org.junit.jupiter.api.Assertions.assertEquals;
import com.google.gson.GsonBuilder;
import io.touca.core.TypeHandler;
import io.touca.types.ToucaType;
import org.junit.jupiter.api.Test;

public final class TypesTest {

  @SuppressWarnings("unused")
  public static final class Foo {
    public String foo = "foo-value";
    public String bar = "bar-value";
  }

  @Test
  public void checkPublicFields() {
    TypeHandler handler = new TypeHandler();
    final ToucaType tt = handler.transform(new Foo());
    assertEquals(ToucaType.Types.Object, tt.type());
    final String json = new GsonBuilder().create().toJson(tt.json());
    assertEquals("{\"foo\":\"foo-value\",\"bar\":\"bar-value\"}", json);
  }
}
